import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function runPythonInDocker(userCode: string, taskId: string, variant: "work" | "solution"): Promise<any> {
    return new Promise((resolve, reject) => {
        const apiPath = path.join(process.cwd(), "tmp", "simulations", taskId, variant, "robot_api.py");

        if (!fs.existsSync(apiPath)) {
            return reject(`robot_api.py not found for task ${taskId} (${variant})`);
        }

        const dockerCommand = `
docker run --rm -i --network none --cpus=0.5 --memory=128m \
-v ${apiPath}:/robot_api.py python:3.12-slim python - <<'EOF'
import json
import robot_api

# Dynamisch alles global verfügbar machen
globals().update({
    name: getattr(robot_api, name)
    for name in dir(robot_api)
    if not name.startswith("_")
})

try:
${userCode
            .split("\n")
            .map((line) => "    " + line)
            .join("\n")}
    print(json.dumps({"commands": get_commands()}))
except Exception as e:
    print(json.dumps({"error": str(e), "commands": globals().get("get_commands", lambda: [])()}))
EOF
`;

        exec(dockerCommand, { timeout: 10000 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || "Execution error");

            try {
                const parsed = JSON.parse(stdout.trim());
                resolve(parsed);
            } catch (parseErr) {
                reject("Invalid output: " + stdout);
            }
        });
    });
}

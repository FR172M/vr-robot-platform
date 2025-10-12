import { Request, Response } from "express";
import { runPythonInDocker } from "../utils/dockerRunner";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";


export async function runCode(req: Request, res: Response) {
    try {
        const { code, taskId, variant = "work" } = req.body;
        if (!code) return res.status(400).json({ error: "No code provided" });
        if (!taskId) return res.status(400).json({ error: "No taskId provided" });

        const result = await runPythonInDocker(code, taskId, variant);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.toString() });
    }
}

// Robot API mit Kategorien
export async function listApi(req: Request, res: Response) {
    const { taskId, variant } = req.params;
    const apiPath = path.join(process.cwd(), "tmp", "simulations", taskId, variant, "robot_api.py");

    if (!fs.existsSync(apiPath)) {
        return res.status(404).json({ error: "robot_api.py not found" });
    }

    const pythonCode = `
import json, inspect, importlib.util, sys

spec = importlib.util.spec_from_file_location("robot_api", "${apiPath}")
robot_api = importlib.util.module_from_spec(spec)
sys.modules["robot_api"] = robot_api
spec.loader.exec_module(robot_api)

api_info = {}
for name in dir(robot_api):
    if not name.startswith("_"):
        obj = getattr(robot_api, name)
        if callable(obj) and hasattr(obj, "_category"):
            sig = str(inspect.signature(obj))
            doc = inspect.getdoc(obj) or ""
            api_info[name] = {"signature": sig, "doc": doc, "category": obj._category}


print(json.dumps(api_info))
`;

    const py = spawn("python3", ["-c", pythonCode]);

    let output = "";
    let error = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (error += data.toString()));

    py.on("close", (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: error || "Python process failed" });
        }
        try {
            const parsed = JSON.parse(output.trim());
            res.json({ apiInfo: parsed });
        } catch (e) {
            res.status(500).json({ error: "Invalid JSON", raw: output });
        }
    });
}

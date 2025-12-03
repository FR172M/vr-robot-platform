from flask import Flask, request, jsonify
import subprocess
import os
import uuid
import shutil
import traceback

app = Flask(__name__)

SANDBOX_DIR = "/sandboxRun"

@app.route("/run", methods=["POST"])
@app.route("/run", methods=["POST"])
def run_code():
    logs = []
    try:
        data = request.json

        run_id = data["runId"]
        sandbox_path = os.path.join(SANDBOX_DIR, run_id)
        logs.append(f"Creating sandbox path: {sandbox_path}")
        os.makedirs(sandbox_path, exist_ok=True)

        # --- wrapper file ---
        wrapper_file_name = data["wrapperFileName"]
        wrapper_file_path = os.path.join(sandbox_path, wrapper_file_name)
        logs.append(f"Writing wrapper: {wrapper_file_path}")
        with open(wrapper_file_path, "w") as f:
            f.write(data["wrapperFileContent"])

        # --- robot_api.py ---
        api_file_name = data["apiFileName"]
        api_file_path = os.path.join(sandbox_path, api_file_name)
        logs.append(f"Writing robot_api: {api_file_path}")
        with open(api_file_path, "w") as f:
            f.write(data["apiFileContent"])

        # --- userCode.py (optional) ---
        if data.get("userCodeContent"):
            user_code_path = os.path.join(sandbox_path, "userCode.py")
            logs.append(f"Writing userCode: {user_code_path}")
            with open(user_code_path, "w") as f:
                f.write(data["userCodeContent"])

        # --- Execute wrapper ---
        logs.append(f"Running Python: {wrapper_file_name}")
        proc = subprocess.run(
            ["python3", wrapper_file_name],
            cwd=sandbox_path,
            capture_output=True,
            text=True
        )

        output = proc.stdout.strip()
        logs.append(f"stdout:\n{proc.stdout}")
        logs.append(f"stderr:\n{proc.stderr}")

        return jsonify({
            "logs": logs,
            "output": output,
            "returncode": proc.returncode
        })

    except Exception as e:
        logs.append("Exception:\n" + traceback.format_exc())
        return jsonify({"logs": logs, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

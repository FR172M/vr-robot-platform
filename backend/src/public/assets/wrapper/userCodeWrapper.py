import json, traceback, sys
sys.path.insert(0, ".")
try:
    import robot_api
    for name in dir(robot_api):
        if not name.startswith("_") and callable(getattr(robot_api, name)):
            globals()[name] = getattr(robot_api, name)
except Exception:
    print(json.dumps({"error": "failed robot_api import"}))
    sys.exit(0)
try:
    exec(open("userCode.py").read())
    out = robot_api.get_commands() if hasattr(robot_api, "get_commands") else None
    print(json.dumps({"commands": out}))
except Exception:
    tb = traceback.format_exc()
    cmds = robot_api.get_commands() if hasattr(robot_api, "get_commands") else []
    print(json.dumps({"error": tb, "commands": cmds}))

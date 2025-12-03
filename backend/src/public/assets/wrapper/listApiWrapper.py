import json, inspect, importlib.util, sys
spec = importlib.util.spec_from_file_location("robot_api", "robot_api.py")
robot_api = importlib.util.module_from_spec(spec)
sys.modules["robot_api"] = robot_api
spec.loader.exec_module(robot_api)

api_info = {}
for name in dir(robot_api):
    if not name.startswith("_"):
        obj = getattr(robot_api, name)
        if callable(obj) and hasattr(obj, "_category"):
            api_info[name] = {"signature": str(inspect.signature(obj)), "doc": inspect.getdoc(obj) or "", "category": obj._category}

print(json.dumps(api_info))

# robot_api.py

commands = []

_current_category = "default"

def set_category(cat: str):
    """Set the current category for subsequent functions"""
    global _current_category
    _current_category = cat

def get_category():
    return _current_category

def get_commands():
    """Return the list of commands executed so far"""
    return commands

# Decorator to automatically attach current category to function
def categorized(func):
    func._category = _current_category
    return func

# ---- Movements --------------------------------------------------------------------------------------------------
set_category("movement")

@categorized
def forward(val: float):
    """Move forward by given distance"""
    commands.append({"command": "forward", "value": val})

@categorized
def backward(val: float):
    """Move backward by given distance"""
    commands.append({"command": "backward", "value": val})

@categorized
def left(val: float):
    """Move left by given distance"""
    commands.append({"command": "left", "value": val})

@categorized
def right(val: float):
    """Move right by given distance"""
    commands.append({"command": "right", "value": val})

@categorized
def up(val: float):
    """Move up by given distance"""
    commands.append({"command": "up", "value": val})

@categorized
def down(val: float):
    """Move down by given distance"""
    commands.append({"command": "down", "value": val})

# ---- Rotations --------------------------------------------------------------------------------------------------
set_category("rotation")

@categorized
def turn(deg: float):
    """Turn robot by given angle in degrees (y-turn)"""
    commands.append({"command": "turn", "value": deg})

@categorized
def pitch(deg: float):
    """Pitch robot by given angle in degrees (z-pitch)"""
    commands.append({"command": "pitch", "value": deg})

@categorized
def roll(deg: float):
    """Roll robot by given angle in degrees (x-pitch)"""
    commands.append({"command": "roll", "value": deg})

# ---- Utilities ----------------------------------------------------------------------------------------------------
set_category("utility")

@categorized
def wait(seconds: float):
    """Wait for given number of seconds"""
    commands.append({"command": "wait", "value": seconds})

@categorized
def reset():
    """Reset the scene and robot position"""
    commands.append({"command": "resetScene", "value": 0})

# ---- Helper (Macros) ----------------------------------------------------------------------------------------------------
set_category("helper")

@categorized
def square(size: float):
    """Move in a square pattern of given side length"""
    for _ in range(4):
        forward(size)
        turn(90)

@categorized
def loop(n: int, fn):
    """Repeat a given function n times"""
    for _ in range(n):
        fn()

@categorized
def sequence(*funcs):
    """Execute a sequence of functions in order"""
    for fn in funcs:
        fn()

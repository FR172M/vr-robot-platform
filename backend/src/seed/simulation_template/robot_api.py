commands = []

# -----------------------------
# Bewegungen
# -----------------------------
def forward(val: float):
    """Move forward by given distance"""
    commands.append({"command": "forward", "value": val})

def backward(val: float):
    """Move backward by given distance"""
    commands.append({"command": "backward", "value": val})

def left(val: float):
    """Move left by given distance"""
    commands.append({"command": "left", "value": val})

def right(val: float):
    """Move right by given distance"""
    commands.append({"command": "right", "value": val})

def up(val: float):
    """Move up by given distance"""
    commands.append({"command": "up", "value": val})

def down(val: float):
    """Move down by given distance"""
    commands.append({"command": "down", "value": val})

# -----------------------------
# Rotationen
# -----------------------------
def turn(deg: float):
    """Turn robot by given angle in degrees"""
    commands.append({"command": "turn", "value": deg})

def pitch(deg: float):
    """Pitch robot by given angle in degrees"""
    commands.append({"command": "pitch", "value": deg})

def roll(deg: float):
    """Roll robot by given angle in degrees"""
    commands.append({"command": "roll", "value": deg})

# -----------------------------
# Steuerung & Utilities
# -----------------------------
def wait(seconds: float):
    """Wait for given number of seconds"""
    commands.append({"command": "wait", "value": seconds})

def reset():
    """Reset the scene and robot position"""
    commands.append({"command": "resetScene", "value": 0})

# Hilfsfunktionen (User Macros)
def square(size: float):
    """Move in a square pattern of given side length"""
    for _ in range(4):
        forward(size)
        turn(90)

def loop(n: int, fn):
    """Repeat a given function n times"""
    for _ in range(n):
        fn()

def sequence(*funcs):
    """Execute a sequence of functions in order"""
    for fn in funcs:
        fn()

# -----------------------------
def get_commands():
    """Return the list of commands executed so far"""
    return commands

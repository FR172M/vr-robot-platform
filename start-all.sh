#!/bin/bash

# Projektpfad merken
PROJECT_DIR=$(pwd)

# Funktion, um ein neues Terminal zu starten
start_terminal() {
    local cmd="$1"
    osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_DIR'; $cmd"
    activate
end tell
EOF
}

# STRG+C fängt alle Signale ab und stoppt Colima
trap 'echo "Stopping Colima..."; colima stop; exit' INT TERM EXIT

# 1️⃣ Colima starten (Docker Runtime)
echo "Starting Colima..."
start_terminal "colima start --cpu 2 --memory 4 --runtime docker --foreground"

# Kurz warten, bis Colima hochfährt
sleep 5

# 2️⃣ Backend starten
echo "Starting Backend..."
start_terminal "npm --prefix backend run dev"

# 3️⃣ Frontend starten
echo "Starting Frontend..."
start_terminal "npm --prefix frontend run dev"

echo "All processes started in separate terminals. Press CTRL+C here to stop Colima and exit."
wait

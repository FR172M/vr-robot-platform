#!/bin/bash

# DockerDemo starten
echo "Ziehe alle Docker-Images..."
docker compose pull

echo "Starte die VR Robot Platform..."
docker compose up -d

echo "Fertig! Die Container laufen jetzt im Hintergrund."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"

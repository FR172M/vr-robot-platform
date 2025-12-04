#!/bin/bash

set -e

ENV_FILE=".env.docker"

if [ ! -f "$ENV_FILE" ]; then
  echo "Erzeuge dynamische .env für dockerDemo ..."

  POSTGRES_USER="user_$(openssl rand -hex 4)"
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  POSTGRES_DB="db_$(openssl rand -hex 4)"
  JWT_SECRET="$(openssl rand -hex 32)"

  cat > "$ENV_FILE" <<EOF
# --- PostgreSQL Container ---
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB

# --- Backend ---
DB_HOST=db
DB_PORT=5432
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_NAME=$POSTGRES_DB
PORT=3000
JWT_SECRET=$JWT_SECRET
IS_DOCKER=true
EOF

  echo ".env wurde erzeugt unter: $ENV_FILE"
else
  echo ".env existiert bereits, wird wiederverwendet: $ENV_FILE"
fi

echo "Ziehe alle Docker-Images..."
docker compose -f docker-compose.yml pull

echo "Starte die Plattform..."
docker compose -f docker-compose.yml up -d

#!/bin/bash

echo "Warte auf Backend-Logs..."
docker compose logs -f backend | while IFS= read -r line; do
    echo "$line"
    if [[ "$line" == *"Inserted 180 task_solutions"* ]]; then
        echo "Backend ist bereit!"
        #pkill -P $$ docker  # killt den docker logs Prozess, nur in der Subshell nötig
        break
    fi
done

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"

FROM node:18-alpine

# Docker CLI installieren, bash für Skripte
RUN apk add --no-cache docker-cli bash curl

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm install --production=false

# Source kopieren
COPY . ./

EXPOSE 3000

CMD npx ts-node src/seed/seedTasks.ts && \
    npx ts-node src/seed/seedUsers.ts && \
    npx ts-node src/seed/seedSolutions.ts && \
    npx ts-node src/app.ts

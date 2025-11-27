# Docker Demo – VR Robot Platform (v0.1)

Diese Demo zeigt, wie ihr die komplette **VR Robot Platform** mit allen Services (Frontend, Backend, Sandbox, Datenbank) lokal starten könnt, ohne selbst die Images bauen zu müssen. Alles ist bereits auf Docker Hub verfügbar.

---

## Voraussetzungen

- Docker Desktop installiert (Windows/macOS) oder Docker CE (Linux)
- Git installiert
- Internetzugang, um die Docker-Images herunterzuladen

---

## Inhalt

Die Demo enthält:

- **docker-compose.yml** – orchestriert alle Services
- **run.sh** – optionales Skript, um alles mit einem Befehl zu starten

Services:

| Service   | Image                  | Beschreibung                        |
|----------|------------------------|-------------------------------------|
| frontend | `fr172m/frontend:v0.1` | React-basiertes Frontend             |
| backend  | `fr172m/backend:v0.1`  | Express-Server, verbindet Frontend, DB und Sandbox |
| db       | `fr172m/db:v0.1`       | PostgreSQL Datenbank                |
| sandbox  | `fr172m/sandbox:v0.1`  | Python-Interpreter Sandbox          |

---

## Schnellstart

### Option 1 - Ein Befehl:

Mit dem Befehl starten alle Container mit **einem einzigen Befehl**:

```bash
git clone https://github.com/fr172m/vr-robot-platform.git && cd vr-robot-platform/dockerDemo && ./run.sh
```

•	Klont das Repository

•	Wechselt in das dockerDemo-Verzeichnis

•	Führt run.sh aus, das die Images pulled und alle Container startet


### Option 2 - Schrittweise:

Dieser besteht aus dem Clonen des Repositories:

```bash
git clone https://github.com/fr172m/vr-robot-platform.git
```

Dem Wechsel in das Verzeichnis `dockerDemo`:

```bash
cd vr-robot-platform/dockerDemo
```

und dem Pull sowie Start der Container (Skript run.sh):

```bash
./run.sh
```
--- 
## Hinweise

•	Die Container laufen im Hintergrund (-d Flag in docker-compose up)

•	Frontend erreichbar unter: http://localhost:5173

•	Backend erreichbar unter: http://localhost:3000

•	DB und Sandbox nutzen interne Volumes, um Daten zwischen Neustarts zu behalten

---
## Logs & Kontrolle

#### Logs eines Services anzeigen
```bash
docker-compose logs -f backend
```
(oder backend, sandbox, db für die anderen Container)


####Einen einzelnen Container neu starten

```bash
docker-compose restart frontend
```
(oder backend, sandbox, db für die anderen Container)


#### Alle Container stoppen

```bash
docker-compose down
```

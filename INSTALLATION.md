# Installation Guide – VR Robot Platform

Dieses Dokument erklärt Schritt für Schritt, wie du die **VR Robot Platform** lokal installierst, konfigurierst und startest.  
Die Plattform besteht aus einem **React-Frontend**, einem **Express-Backend** und einer **PostgreSQL-Datenbank**.  
Zusätzlich kann **Docker** für isolierte Python-Codeausführung genutzt werden.

---

## 📋 Voraussetzungen

Bitte installiere folgende Tools vorab:
| Tool | Empfohlene Version | Zweck |
|------|--------------------|--------|
| [Node.js](https://nodejs.org/) | ≥ 16 | Laufzeitumgebung für Frontend & Backend |
| npm | passend zu Node.js | Paketverwaltung |
| [PostgreSQL](https://www.postgresql.org/download/) | ≥ 13 | Datenbank |
| [Docker](https://www.docker.com/) | ≥ 20 | Optionale Sandbox für Codeausführung |
| Git | aktuell | Repository-Klon & Versionierung |

> 💡 Stelle sicher, dass **Docker Desktop** läuft, falls du Python-Code in der Plattform ausführen willst.

---

## 1. Repository klonen

```bash
git clone https://github.com/FR172M/vr-robot-platform.git
cd vr-robot-platform
```

## 2. Umgebungsvariablen einrichten
Erstelle im Verzeichnis backend/ eine Datei namens .env:
```bash
cd backend
touch .env
```

Füge dann folgende Konfiguration ein:
```ini
DB_HOST=localhost
DB_PORT=5432
DB_USER=dein_db_user
DB_PASSWORD=dein_db_passwort
DB_NAME=vr_robot_db
PORT=3000
```
Passe DB_USER, DB_PASSWORD und DB_NAME an deine lokale PostgreSQL-Konfiguration an.

## 3. Datenbank vorbereiten
### 3.1 Datenbank erstellen
Melde dich in PostgreSQL an (z. B. via Terminal oder PGAdmin):
```bash
psql -h localhost -U dein_db_user
CREATE DATABASE vr_robot_db;
\q
```
### 3.2 Tabellenstruktur anlegen
Die Tabellen werden automatisch beim Start des Backends erstellt oder über ein Seed-Skript (siehe Schritt 6).

## 4. Abhängigkeiten installieren
### 4.1 Root (optional)
```bash
npm install
```
### 4.2 Backend
```bash
cd backend
npm install
cd ..
```
### 4.3 Frontend
```bash
cd frontend
npm install
cd ..
```
## 5. Beispiel-Daten (Seed)
Um Testdaten und Beispielaufgaben zu laden im Root:
```bash
npm run seed
```
Dies legt Beispielaufgaben an und kopiert Simulationsdateien nach
backend/public/uploads/< taskId >/...

## 6. Start der Anwendung (Entwicklung)

Es gibt zwei Möglichkeiten, die Plattform lokal zu starten:
Das Backend läuft standardmäßig unter: http://localhost:3000
Das Frontend läuft standardmäßig unter: http://localhost:5173

---

### 6.1 Alles über Root-Skript starten (empfohlen)

Im Terminal im Projektstammverzeichnis:

```bash
npm run dev
```
- Startet Backend und Frontend parallel
- Vorteil: Nur ein Terminal nötig, einfacher Workflow.

### 6.2 Backend und Frontend separat starten
In separaten Terminals:
#### Backend:
```bash
cd backend
npm run dev
```
####Frontend:
```bash
cd frontend
npm run dev
```

- Vorteil: Separates Logging und einfacheres Debugging, falls nur Backend oder Frontend neu gestartet werden soll.

## 7. Überprüfung
- Öffne http://localhost:5173 im Browser
- Navigiere durch Eingabe der Passwörter "teacher" oder "student" und Klicken des jeweiligen Buttons zu einer beiden Ansichten
- Prüfe, ob Aufgaben aus der Datenbank angezeigt werden
- Öffne das Browser-Dev-Tool (Console/Network)
- Wenn GET /api/tasks erfolgreich ist, funktioniert das Backend

## 8. (Optional) Docker-Test für Codeausführung
Die Plattform kann Python-Code in einem isolierten Docker-Container ausführen.
Teste den Docker-Zugriff:
```bash
docker run hello-world
```
Wenn das funktioniert, ist Docker korrekt installiert.
Im Backend-Log sollte bei Python-Codeausführung eine Zeile ähnlich dieser erscheinen:
```css
[DockerRunner] Running isolated python code...
```
## 9. Projektstruktur
```bash
/vr-robot-platform          # Repository Root
├─ backend/                 # Express + TypeScript Backend
│ ├─ src/
│ │ ├─ controllers/         # Express Controller (Tasks, Upload, Code)
│ │ ├─ routes/              # API-Endpunkte (taskRoutes.ts, codeRoutes.ts)
│ │ ├─ db/                  # PostgreSQL-Verbindung und Helper
│ │ ├─ utils/               # Helfer (DockerRunner, SimulationManager, tmpSimulationManager)
│ │ ├─ public/uploads/      # Hochgeladene Dateien / Simulationen
│ │ └─ seed/                # seedTasks.ts + Beispiel-Simulationen
│ ├─ .env                   # lokal zu erstellen! Umgebungsvariablen (DB-Zugang etc.)
│ ├─ package.json           # Backend-spezifische Abhängigkeiten & Scripts
│ └─ tsconfig.json          # TypeScript-Konfiguration
│
├─ frontend/                # React + Vite Frontend
│ ├─ src/                   # Komponenten, Pages, Store, Utils
│ ├─ public/                # Statische Assets
│ ├─ vite.config.ts         # Vite-Konfiguration
│ └─ package.json           # Frontend-Abhängigkeiten & Scripts
│
├─ package.json             # Root-Skripte (concurrently: dev, seed)
├─ README.md                # Projektbeschreibung, Hinweise, Updates
├─ INSTALLATION.md          # Installations- und Setup-Anleitung
└─ PRD.md                   # Produktanforderungsdokument
```
## 10. Fehlerbehebung

| Problem | Ursache | Lösung |
|----------|----------|--------|
| **Backend startet nicht (ECONNREFUSED)** | PostgreSQL läuft nicht oder falsche Zugangsdaten | Prüfe die `.env`-Datei und stelle sicher, dass die Datenbank läuft und der User Zugriff hat |
| **Frontend zeigt keine Tasks** | API nicht erreichbar | Stelle sicher, dass `npm run dev` im Backend läuft und die Ports korrekt sind |
| **Seed-Fehler** | Pfade in `seedTasks.ts` ungültig oder Dateien fehlen | Kontrolliere die Pfade zu den Simulationen in `backend/src/seed` |
| **Docker-Fehler bei Codeausführung** | Docker-Daemon inaktiv oder Berechtigungsproblem | Starte Docker Desktop oder füge deinen User zur `docker`-Gruppe hinzu |
| **Portkonflikt** | 3000 oder 5173 bereits belegt | Ändere die Ports in der `.env`-Datei oder in `vite.config.ts` für das Frontend |
| **Simulation lädt nicht im Frontend** | ZIP-Datei fehlerhaft oder Pfad stimmt nicht | Prüfe den Upload-Pfad in `backend/public/uploads/<taskId>/` und öffne ggf. direkt `index.html` |
| **Fehler beim Python-Codeausführen** | Docker nicht verfügbar oder Python-Umgebung fehlt | Prüfe, ob Docker läuft und die Berechtigungen stimmen, ggf. Python lokal installieren |

# 🤖 VR Robot Platform

*Dieses README wurde nach Analyse des Projekts durch KI automatisch erstellt. Es beschreibt die aktuell implementierten Features, die Architektur, die wichtigsten Endpunkte, Entwicklungs- und Deployment-Hinweise sowie Troubleshooting.*

- [Installationsanleitung (Lokal)](INSTALLATION.md)
- [Installationsanleitung (DockerImages)](DOCKERDEMO.md)
- [Link zum PRD](PRD.md)

---

## Kurze Zusammenfassung

Die **VR Robot Platform** ist ein TypeScript/Node + React (Vite) + PostgreSQL Projekt, das Lehrenden erlaubt, Aufgaben mit Unity WebGL-Simulationen bereitzustellen, und Lernenden erlaubt, innerhalb einer WebGL-Simulation Pseudocode / Python-Code auszuführen, der in einer sicheren Umgebung (Docker) geparst/ausgeführt wird. Wichtige Implementationen:

* Vollständiges **Backend** in TypeScript (Express) mit Upload/Download/CRUD für Tasks.
* **Frontend** in React + Vite + MUI mit Seiten für Teacher / Student / Simulation.
* Unterstützung für **Unity WebGL ZIP-Uploads** (Work / Solution), die beim Anzeigen temporär entpackt und über einen dynamischen statischen Mount served werden.
* **Temporäre Extraktion** der Simulationen unter `backend/tmp/simulations/<taskId>/<variant>` plus automatisches Cleanup.
* **Code-Ausführung/Analyse**: Backend bietet Endpunkte zum *Auflisten* der API-Funktionen (`robot_api.py`) und zum *Ausführen* von Python-Code in einem Docker-Container (netzwerkisoliert, Ressourcen-limitiert, Timeout).
* Seed-Skript zum Befüllen der DB mit Beispiel-Tasks + Beispiel-Simulationen.

---

## Projektstruktur

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
│ ├─ .env.local                   # lokal zu erstellen! Umgebungsvariablen (DB-Zugang etc.)
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


---

## Implementierte Features — Detailliert

### Backend (TypeScript, Express)

* **Task CRUD**: `/api/tasks` (GET/POST) und `/api/tasks/:id` (GET/PUT/DELETE).

  * Model / mapping: DB-Spalten (snake_case) werden in JS-Objekte (camelCase) via `dbRowToTask` gemappt.
  * Erwartete Task-Spalten: `id, title, description, difficulty, pseudocode, sample_solution, worksheet_path, sim_work_path, sim_solution_path, created_at, start_date, due_date`.

* **File Uploads (Multer)**

  * `POST /api/tasks/:id/upload-work-simulation` — Upload einer ZIP-Datei mit Work-Simulation (originaler Dateiname wird beibehalten).
  * `POST /api/tasks/:id/upload-solution-simulation` — Upload einer ZIP-Datei mit Solution-Simulation.
  * `POST /api/tasks/:id/upload-worksheet` — Upload eines Worksheet-/PDF-Files.
  * Uploads werden gespeichert unter `backend/src/public/uploads/<taskId>/<variant>/<originalFilename>` und der relative Pfad in die DB geschrieben.

* **Download**

  * `GET /api/tasks/:id/download-work`
  * `GET /api/tasks/:id/download-solution`
  * `GET /api/tasks/:id/download-worksheet`
  * (Controller sendet Datei mit passenden Headers)

* **Simulation-Viewing**

  * `GET /api/:id/view-simulation/:variant` (variant = `work` | `solution`) → Backend entpackt die ZIP in einen temporären Ordner `backend/tmp/simulations/<id>/<variant>` (falls nicht bereits entpackt), mountet diesen Ordner per `express.static` unter `/simulation/<id>/<variant>` (dynamisch, einmalig) und redirectet auf `/simulation/<id>/<variant>/index.html`.
  * Die Simulation wird also vom Backend gehostet, die Frontend-App lädt diese URL in ein `<iframe title="Simulation">`.

* **TMP Cleanup / Keepalive**

  * Temporäre Extraktions-Ordner werden über `tmpSimulationManager` verwaltet. Nach Inaktivität (Timer) werden Ordner gelöscht.
  * Keepalive-Endpoint: `POST /api/tasks/:id/simulation-keepalive/:variant` — die Frontend-Simulation feuert diesen Heartbeat, um das Löschen zu verhindern.
  * Es existiert ein `POST /api/:id/clear-tmp` Endpoint, der TMP-Ordner für `work` und `solution` löscht.

* **Python API-Analyse & Code-Execution**

  * `GET  /api/code/list-api/:taskId/:variant` — lädt `robot_api.py` aus dem entpackten Simulation-Ordner (`tmp/simulations/...`) und parst Funktionen / Docstrings mit einem kurzen Python-Snippet, das über `spawn('python3', ...)` ausgeführt wird. Antwortformat: JSON mit `apiInfo`.
  * `POST /api/code/run-python` — nimmt `{ code, taskId, variant }` entgegen und führt den Code in Docker aus (siehe `dockerRunner.ts`).

    * Docker-Command setzt `--network none`, `--cpus=0.5`, `--memory=128m`, bind-mountet nur die `robot_api.py` und führt einen Python-Wrapper, der `robot_api` importiert, den User-Code injiziert/ausführt und schließlich `get_commands()` serialisiert.
    * Wenn Docker nicht verfügbar, schlägt dieser Flow fehl — Docker wird vorausgesetzt für sicheres Ausführen.

* **Seed**

  * `backend/src/seed/seedTasks.ts` erstellt Beispiel-Tasks inklusive Beispiel-Simulationen und legt Dateien in `public/uploads/...` ab.

### Frontend (React, Vite, MUI)

* **Pages**

  * `UserPage` — Tasks anlegen / bearbeiten (TaskForm), Upload von Simulation/Worksheet, Tabs für Alle / aktuell / anstehend, Delete, Edit.
  * `StudentPage` — Task-Liste (read-only), Download (work/solution/pdf) und `Visibility`-Button öffnet die Simulation (Fullscreen-Dialog → `SimulationPage`).
  * `SimulationPage` — Fullscreen-Dialog/Screen mit:

    * eingebetteter `<iframe title="Simulation">` zeigt die entpackte Simulation (index.html).
    * **Monaco Editor** (Python) zum schreiben/ändern von Code/Pseudocode.
    * `Run`-Button → `POST /api/code/run-python` (Backend führt Code gegen `robot_api.py` aus und antwortet mit erzeugten Befehlen).
    * Steuer-Buttons (Forward/Left/Right/Reset) → senden `postMessage`-Kommandos an das IFrame (JSON-Array mit Commands).
    * Polling für `list-api` (falls `robot_api.py` noch nicht entpackt ist).

* **Components**

  * `TaskCard`, `TaskForm`, `UploadFileButton` — wiederverwendbare UI-Komponenten.
  * `TaskForm` implementiert multistep-Flow (Create/Edit), Dateifelder, Validierung und speichert Tasks per API.

* **Services**

  * `services/taskService.ts` — Axios-Wrapper für Tasks (getTasks, saveTask, updateTask, deleteTask).

---

## Deployment

### Lokales Deployment

Das Projekt ist vollständig lokal lauffähig. Stelle sicher, dass Docker, Node.js, PostgreSQL und npm installiert sind.

Alle Schritte sind in der [Installationsanleitung](INSTALLATION.md) ausführlich beschrieben.

Das Frontend ist im Anschluss unter `http://localhost:5173` erreichbar, das Backend unter `http://localhost:3000`.

## Bekannte Einschränkungen / Nächste Schritte

* Keine Benutzerverwaltung (Login, JWT, Rollen) — aktuell rein clientseitige Rollenumschaltung.
* Keine Filevalidierung (ZIP-Inhalt wird direkt entpackt; zukünftige Erweiterung: MIME-Typ-Check, max. Größe).
* `run-python` setzt Docker voraus; bei fehlendem Docker-Daemon keine Fallback-Ausführung.
* Simulationen müssen Unity-WebGL-kompatibel sein (Index.html + Build-Dateien im ZIP).

### Geplante Erweiterungen

* Benutzer- und Rechteverwaltung (Teacher vs. Student authentifiziert)
* Automatisches Scoring-System basierend auf Output des `robot_api.py`
* Historie hochgeladener Lösungen (DB-Tabelle `solutions`)
* Integration in Unity XR Toolkit / native VR-Client
* Optional: Export der Ergebnisse als PDF (per API)

---

## Lizenz

Dieses Projekt ist im Rahmen meiner Diplomarbeit entstanden und ist für Forschungs- und Lehrzwecke vorgesehen. Lizenzinformationen werden in Zukunft ergänzt. 

#### Titel der Diplomarbeit:

**Aufbau einer Infrastruktur am SML für hybride Lehre im Bereich der Roboterprogrammierung**

---

## Autor & Kontakt

Projekt: **VR Robot Platform**

Entwickelt von: **Fritz Mattheß**

Kontakt: **fritz.matthess@mailbox.tu-dresden.de** 

---

*Ende der README-Version — Oktober 2025*

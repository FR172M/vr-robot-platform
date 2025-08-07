# 🤖 VR Robot Platform

Ein interaktives Web-System zur Fernprogrammierung von Robotern in einer virtuellen Umgebung.

---

## 🧠 Ziel

Die Plattform erlaubt es **Teacher:innen**, Aufgaben mit zugehörigen VR-Simulationen bereitzustellen und **Student:innen**, diese Simulationen aufzurufen, zu analysieren und eigene Pseudocode-Lösungen hochzuladen.  
Eine zentrale Komponente ist die Integration von Unity WebGL-Simulationen pro Task.

---

## 🚀 Features

### 👩‍🏫 Teacher View
- Aufgaben (Tasks) erstellen, bearbeiten, löschen
- Pro Task eine ZIP-Datei hochladen mit Unity WebGL Simulation
- ZIP-Dateien werden im Originalnamen gespeichert (zur besseren Übersicht)
- Aufgaben samt ZIP-Dateien werden serverseitig gespeichert

### 🧑‍🎓 Student View
- Anzeige aller veröffentlichten Tasks
- Öffnen der Simulation im Dialog
- Temporäres Entpacken der ZIP-Datei zur Anzeige im iFrame
- Timeout: Entpackte Dateien werden nach 5 Minuten automatisch gelöscht (wenn Simulation geschlossen)

---

## 🛠️ Tech Stack

| Bereich     | Technologie                        |
|------------|------------------------------------|
| Frontend   | React (Vite), Material UI, Axios   |
| Backend    | Node.js, Express, Multer, fs-extra |
| Datenbank  | PostgreSQL                         |
| VR         | Unity (WebGL export, später)       |
| Uploads    | ZIP-Dateien, temporäres Entpacken  |

---

## 🗂️ Projektstruktur

vr-robot-platform/
├── backend/
│   ├── node_modules
│   ├── src/
│   │	├── controllers/
│   │   │   ├── taskController.ts
│   │   │   └── uploadController.ts
│   │	├── db/
│   │	│   └── index.ts
│   │	├── models/
│   │	│   └── Task.ts
│   │	├── public/
│   │	│   └── uploads/
│   │	│	└── <taskId>
│   │	├── routes/
│   │	│	└── taskRoutes.ts
│   │	├── seed/
│   │   │   ├── simulation_template/
│   │   │   │	├── index.html
│   │   │   │	├── script.js
│   │	│   │	└── style.css
│   │	│   └── seedTasks.ts
│   │	├── utils/
│   │	│	└── simulationManager.ts
│   │	├── app.ts
│   │	└── test.ts
│   ├── tmp/
│   │	└── simulations/
│   │		└── <taskId>/
│   ├── .env 
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── node_modules/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskCard.tsx
│   │   │   └── UploadSimulationButton.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── StudentPage.tsx
│   │   │   └── TeacherPage.tsx
│   │   ├── services/
│   │   │   └── taskService.ts
│   │   ├── types/
│   │   │   ├── EditableTask.ts
│   │   │   └── Task.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── test.ts
│   │   └── vite-env.d.ts
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── node_modules/
├── package.json
├── package-lock.json
└── README.md

---

## ⚙️ Setup Guide

### 🔧 Voraussetzungen

- Node.js (v18+)
- PostgreSQL
- Unity (für spätere WebGL-Simulationen)

---

### 📦 Backend starten

```bash
cd backend
npm install
npm run dev
```

- Läuft unter `http://localhost:3000`
- Uploads: `public/uploads/<taskId>/<originalFileName>.zip`
- Temporäre Entpackung: `tmp/simulations/<taskId>/`

---

### 🌐 Frontend starten

```bash
cd frontend
npm install
npm run dev
```

- Läuft unter `http://localhost:5173`
- `.env`: ggf. `VITE_API_BASE_URL=http://localhost:3000`

---

### 🧪 Seed-Daten erzeugen

```bash
cd seed
ts-node seedTasks.ts
```

- Löscht bestehende Tasks und zugehörige Simulationen
- Fügt Beispiel-Tasks für Teacher-View hinzu

---

## 🖼️ Simulation anzeigen

1. Teacher lädt ZIP-Datei mit `index.html`, `style.css`, `script.js`, etc.
2. Beim Klick auf "View" wird ZIP temporär nach `tmp/simulations/<taskId>` entpackt.
3. `index.html` wird im iFrame angezeigt:  
   `http://localhost:3000/<taskId>/view-simulation`
4. Nach 5 Minuten Inaktivität wird der Ordner automatisch gelöscht.
5. Wird die Simulation erneut geöffnet, wird derselbe entpackte Ordner verwendet und Timeout zurückgesetzt.

---

## 🚧 ToDo / Ideen

- [ ] Pseudocode-Upload durch Student:innen
- [ ] Auswertung von Lösungen (manuell/automatisch)
- [ ] Authentifizierung / Rollenverwaltung
- [ ] VR-Komponente mit Unity (Robotersimulation)
- [ ] Deployment (z. B. mit Docker)

---

## 📝 Hinweise

- Die ZIP-Dateien dürfen eine funktionsfähige WebGL/HTML5-Seite enthalten (`index.html`, Ressourcen etc.)
- Der MIME-Typ-Header wird korrekt gesetzt, jedoch kann der Browser `nosniff`-Fehler anzeigen (irrelevant für Funktion)
- Unterschiedliche Ports (3000 vs 5173) erzeugen Cross-Origin-Warnings → ebenfalls unkritisch

---

## 📮 Kontakt

Erstellt im Rahmen einer Diplomarbeit.  
Bei Fragen oder Interesse: **[Kontaktperson: Vera Matthes]**

---
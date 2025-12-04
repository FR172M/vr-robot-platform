# Docker Demo – VR Robot Platform (v0.2)

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
| frontend | `fr172m/frontend:v0.2` | React-basiertes Frontend             |
| backend  | `fr172m/backend:v0.2`  | Express-Server, verbindet Frontend, DB und Sandbox |
| db       | `fr172m/db:v0.2`       | PostgreSQL Datenbank                |
| sandbox  | `fr172m/sandbox:v0.2`  | Python-Interpreter Sandbox          |

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

•	es wird eine .env dynamisch erstellt durch das run.sh Skript

•	nach dem Start der Container werden im Backend die Seed-Skripte ausgeführt, weshalb es zu einer kurzen Verzögerung kommen kann, bis der Login funktioniert



---
## Seeds

Es werden standardmäßig beim Start der Images seeding Skripte ausgeführt.
Hierbei werden die Tabellen "tasks", "users" sowie "task_solutions" der Datenbank angelegt und mit Daten gefüllt, sodass die Funktionalitäten der Anwendung erforscht werden können.

### User
Die Mailadressen der geseedeten User werden zu Beginn geloggt - die Passwörter sind für alle entweder **"Testing1Teacher"** oder **"Testing1Student"** - je nach Rolle des Users.

#### Beispiele:
```
Mail:       teacher@tu-dresden.de
Passwort:   Testing1Teacher
```
```
Mail:       student@tu-dresden.de
Passwort:   Testing1Student
```

Man kann sich natürlich auch neu registrieren. Man bekommt hierbei standardmäßig die Rolle "student".
Die Mailadressen müssen folgendes Format haben (TU Dresden Standard):
```
vorname.nachname[n]@mailbox.tu-dresden.de
vorname.nachname[n]@tu-dresden.de

• [n] = fortlaufende Nummern (ohne die Klammern) zur Unterscheidung bei Namensgleichheit
• Leerzeichen im Namen werden durch Unterstrich abgebildet
```

Das Passwort benötigt mindestens:
```
• einen Kleinbuchstaben
• einen Großbuchstaben
• eine Ziffer oder Sonderzeichen
```

### Tasks und Solutions
Es werden insgesamt 15 Tasks geseedet - je 5 previous, current und upcoming.
Dabei verwenden die current tasks die globale Simulation.

Am Ende des seeds wir auch task_solutions gefüllt - dies erfolgt zufällig und ändert sich somit bei jedem Start der Images.
Dadurch entsteht ein etwas realistisches Bild, dass ein User eine Aufgabe (nicht) angefangen oder abgegeben hat und man sieht die Benotungen und Feedback.
Somit sieht man den Status der Aufgaben für die einzelnen Studenten. 
Als Teacher kann man zudem in dem Bereich "start grading" eine Übersicht pro Task aufrufen.

---

## Logs & Kontrolle

#### Logs eines Services anzeigen
```bash
docker-compose logs -f frontend
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

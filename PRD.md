# 🇩🇪 Produktanforderungsdokument (PRD) – Hybride Roboter-Programmierplattform

## 1. Executive Summary

Die hybride Roboter-Programmierplattform ist eine innovative Lern- und Forschungsumgebung, die reale Roboter und virtuelle Simulationen zu einem einzigen intelligenten System verbindet.

Sie ermöglicht es, physische Roboter durch digitale Zwillinge zu steuern, wodurch Studierende, Forschende und Ingenieur:innen sicher experimentieren, entwickeln und lernen können.

Im Zentrum steht die Idee, dass jede Änderung am Code oder Verhalten eines Roboters zunächst in einer virtuellen Simulation getestet wird – und erst dann auf den echten Roboter übertragen wird.  
So entstehen Sicherheit, Geschwindigkeit und ein neues Verständnis für Robotik.

---

## 2. Vision & Zielsetzung

Ziel ist die Entwicklung einer universellen Plattform für hybride Robotik, die:

- Roboterumgebungen als digitale Zwillinge bereitstellt
- Code in verschiedenen Programmiersprachen (Python, ROS, C++, etc.) ausführt
- Den synchronen Datenaustausch zwischen realem und virtuellem Roboter ermöglicht

Die Plattform soll weltweit nutzbar sein – in Lehre, Forschung und Industrie – und den Umgang mit Robotern revolutionieren, indem sie physische Maschinen virtuell erlebbar und sicher steuerbar macht.

---

## 3. Aktueller Stand – Phase 1: Universitäre Lehre (MVP)

In der ersten Entwicklungsphase steht der Einsatz an Hochschulen im Mittelpunkt.  
Studierende können Aufgaben bearbeiten, Simulationen starten und Pseudocode hochladen.  
Lehrende verwalten die Aufgaben und laden Simulationen (Unity WebGL) hoch.

**Technologische Basis:**

- **Frontend:** React (Vite), Material UI, Axios
- **Backend:** Node.js, Express.js, PostgreSQL
- **Simulation:** Unity WebGL (Prototyp), angebunden per REST API

**Funktionen:**

- Task Management (CRUD)
- Simulation Uploads (ZIP via Multer)
- Student View mit Lösungseingabe
- Synchronisation per API

**Ziel:** Aufbau einer stabilen, sicheren und intuitiven Lernplattform.

---

## 4. Phase 2 – Übergang zur generischen Forschungsplattform

Im zweiten Schritt wird die Plattform für Forschung und industrielle Nutzung erweitert.  
Hierbei werden:

- echte Roboter-APIs eingebunden
- Bidirektionale Synchronisation von Sensordaten und Steuerbefehlen implementiert
- Echtzeitübertragung zwischen Simulation und Hardware gewährleistet

**Neue Kernfeatures:**

- Unterstützung mehrerer Programmiersprachen
- Echtzeitüberwachung des Roboters in der Simulation
- Fehlerdiagnose, Logging & Replay-Funktion
- Sicherheitsprüfungen vor Code-Ausführung auf physischer Hardware
- Remote-Zugriff & kollaborative Entwicklung

---

## 5. Hauptziel – Generische hybride Plattform

Langfristig wird die Plattform als unternehmens- und forschungsübergreifendes System aufgebaut.  
Sie kann beliebige Roboter, Sensoren, Umgebungen und Steuerungslogiken integrieren.

**Anwendungsfelder:**

- Universitäre Lehre
- Forschung & Entwicklung
- Industrielle Trainings
- Simulation-based Robotics Deployment

**Technologische Zielarchitektur:**

- **Frontend:** React + Next.js + Three.js (für 3D/VR)
- **Backend:** Node.js + GraphQL/REST Hybrid
- **Datenbank:** PostgreSQL + TimescaleDB (Sensorlogging)
- **Simulation:** Unity XR Toolkit, WebGL & native VR
- **Kommunikation:** WebSocket + ROSBridge
- **Cloud Deployment:** Kubernetes + Docker
- **Authentifizierung:** OAuth2 / SSO

---

## 6. User Roles

| Rolle     | Beschreibung                                                |
|-----------|-------------------------------------------------------------|
| Teacher   | Erstellt Aufgaben, lädt Simulationen hoch, bewertet Lösungen |
| Student   | Bearbeitet Aufgaben, programmiert Simulationen              |
| Researcher| Testet neue Roboter, Sensoren, Steuerungen                  |
| Admin     | Verwaltet Benutzer, Rechte, Sicherheit und Systeme          |
| Engineer  | Bindet neue Robotermodelle und Hardware ein                 |

---

## 7. Use Cases / User Journeys

1. Teacher erstellt Task mit Simulation (Unity ZIP Upload)
2. Student öffnet Simulation im Browser, gibt Code ein oder lädt Datei hoch
3. Simulation reagiert live auf Code-Eingabe
4. Lösung wird gespeichert, Lehrer kann Feedback geben
5. In Phase 2: Code wird nach erfolgreicher Simulation an realen Roboter gesendet
6. Roboter sendet Sensordaten an Simulation zurück (Echtzeitspiegelung)

---

## 8. Funktionale Anforderungen

- Aufgabenmanagement (CRUD)
- Benutzerrollen & Berechtigungen
- Datei-Upload & Verwaltung
- Echtzeitkommunikation Simulation ↔ Roboter
- Multi-Language Code Execution
- Logging & Fehlerbehandlung
- Datensynchronisation (Sensoren, Telemetrie)

---

## 9. Nicht-funktionale Anforderungen

- **Performance:** Latenz unter 100 ms bei Echtzeitübertragung
- **Security:** Ende-zu-Ende-Verschlüsselung, Auth, Rollenmodelle
- **Scalability:** Cloud-native Architektur
- **Accessibility:** WCAG 2.1 AA-konform
- **Compliance:** DSGVO, ISO 27001, IT-SiG

---

## 10. Roadmap

| Phase     | Zeitraum   | Ziel                                               |
|-----------|------------|----------------------------------------------------|
| MVP       | 2025 Q3–Q4 | Universitäre Lehre, lokale Simulationen            |
| Phase 2   | 2026 Q1–Q4 | Echtzeit-Kopplung mit realen Robotern             |
| Phase 3   | 2027 Q1++  | Vollständige hybride Plattform mit Cloud-Integration |

---

## 11. Akzeptanzkriterien

- Alle Simulationen laufen stabil und reproduzierbar
- Robotersteuerung sicher und synchron
- Datenschutz & Sicherheit vollständig erfüllt
- UI/UX international verständlich
- System dokumentiert & erweiterbar

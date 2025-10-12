# Backend Setup

## 1. Datenbank einrichten
Erstelle eine PostgreSQL-Datenbank:

```sql
CREATE DATABASE vrapp;
```

## 2. Datenbank seeden

seede die Datenbank mit 

```
cd backend
npx ts-node src/seed/seedTasks2.ts
```

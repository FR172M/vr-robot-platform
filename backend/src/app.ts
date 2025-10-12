// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import taskRoutes from './routes/taskRoutes';
import codeRoutes from './routes/codeRoutes';   // 👈 NEU
import dotenv from 'dotenv';
import path from 'path';
import { cleanTmpOnStartup } from './utils/tmpSimulationManager';

dotenv.config();
cleanTmpOnStartup();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(bodyParser.json());

// deine bestehenden Routen
app.use('/', taskRoutes);
app.use('/api', taskRoutes);
app.use('/api/tasks', taskRoutes);

// neue Python-Code Route
app.use('/api/code', codeRoutes);

// statische Ordner
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/tmp/simulations', express.static(path.join(__dirname, '../tmp/simulations')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

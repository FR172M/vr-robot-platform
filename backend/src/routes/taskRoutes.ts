// src/routes/taskRoutes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {extractSimulation, getSimulationZipPath} from '../utils/simulationManager';


import {
    getTasks,
    postTask,
    deleteTask,
    updateTask, getTaskById,
} from '../controllers/taskController';

import {
    uploadSimulation,
    downloadSimulation
} from '../controllers/uploadController';

const router = express.Router();

// --- CRUD ---
router.get('/task', getTasks);
router.post('/task', postTask);
router.delete('/task/:id', deleteTask);
router.put('/task/:id', updateTask);

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const taskId = req.params.id;
        const uploadPath = path.join(__dirname, '../public/uploads', taskId);

        // ❗ Alte Dateien VOR dem Upload löschen
        if (fs.existsSync(uploadPath)) {
            fs.readdirSync(uploadPath).forEach(fileName => {
                fs.unlinkSync(path.join(uploadPath, fileName));
            });
            console.log(`♻️ Alte Dateien im Ordner ${uploadPath} gelöscht`);
        }

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Originalname beibehalten
    }
});

const upload = multer({ storage });
3
// --- Upload + Download ---
router.post('/tasks/:id/upload-simulation', upload.single('simulation'), uploadSimulation);
router.get('/tasks/:id/download-simulation', downloadSimulation);

// --- GET Task by ID ---
router.get('/tasks/:id', getTaskById);

router.get('/:id/view-simulation', async (req, res) => {
    const taskId = req.params.id;

    try {
        // 1. Simulation-Dateipfad aus DB holen
        const zipPath = await getSimulationZipPath(taskId);
        if (!zipPath || !fs.existsSync(zipPath)) {
            return res.status(404).send('Simulation zip not found');
        }

        // 2. Simulation entpacken
        const extractedPath = await extractSimulation(taskId, zipPath);

        // 3. index.html ausgeben
        res.sendFile(path.join(extractedPath, 'index.html'));
    } catch (err) {
        console.error('Error extracting or serving simulation:', err);
        res.status(500).send('Simulation error');
    }
});




router.use('/:id', (req, res, next) => {
    const taskId = req.params.id;
    const staticDir = path.join(__dirname, '../../tmp/simulations', taskId);

    // Wenn Datei existiert → direkt senden
    const filePath = path.join(staticDir, req.path.replace(`/${taskId}`, ''));

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    next();
});



export default router;

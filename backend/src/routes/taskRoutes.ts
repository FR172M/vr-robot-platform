// src/routes/taskRoutes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractSimulation, getSimulationZipPath } from '../utils/simulationManager';

import {
    getTasks,
    postTask,
    deleteTask,
    updateTask,
    getTaskById,
} from '../controllers/taskController';

import {
    downloadWorkSimulation,
    downloadSolutionSimulation,
    downloadPdf,
    uploadWorkSimulation,
    uploadSolutionSimulation,
    uploadPdf
} from '../controllers/uploadController';
import {deleteSimulationFolder, scheduleCleanup} from '../utils/tmpSimulationManager';

import { authenticateJWT, authorizeRoles } from '../auth/auth';



const router = express.Router();

router.use(authenticateJWT);


// ----------------- CRUD -----------------
router.get('/', getTasks);
router.get('/:id', getTaskById);

router.post('/', authorizeRoles('teacher'), postTask);
router.put('/:id', authorizeRoles('teacher'), updateTask);
router.delete('/:id', authorizeRoles('teacher'), deleteTask);

// ----------------- Multer Setup -----------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const taskId = req.params.id;
        let variant: string;

        if (req.path.includes('upload-work-simulation')) {
            variant = 'work';
        } else if (req.path.includes('upload-solution-simulation')) {
            variant = 'solution';
        } else if (req.path.includes('upload-worksheet')) {
            variant = 'worksheet';
        } else {
            variant = 'misc';
        }

        const uploadPath = path.join(__dirname, '../public/uploads', taskId, variant);

        // Ordner erstellen, aber **nicht löschen**, wenn du mehrere Dateien behalten willst
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });


// ----------------- Upload Routes -----------------
router.post('/:id/upload-work-simulation', authorizeRoles('teacher'), upload.single('simulation'), uploadWorkSimulation);
router.post('/:id/upload-solution-simulation', authorizeRoles('teacher'), upload.single('simulation'), uploadSolutionSimulation);
router.post('/:id/upload-worksheet', authorizeRoles('teacher'), upload.single('pdf'), uploadPdf);

// ----------------- Download Routes -----------------
router.get('/:id/download-work-simulation', downloadWorkSimulation);
router.get('/:id/download-solution-simulation', downloadSolutionSimulation);
router.get('/:id/download-worksheet', downloadPdf);

// ----------------- View Simulation -----------------
router.get('/:id/view-simulation/:variant', async (req, res) => {
    const { id: taskId, variant } = req.params;

    if (variant !== 'work' && variant !== 'solution')
        return res.status(400).send('Invalid variant');

    const zipPath = await getSimulationZipPath(taskId, variant as 'work' | 'solution');
    console.log(zipPath)
    if (!zipPath) return res.status(404).send('Simulation ZIP not found');

    const extractDir = await extractSimulation(taskId, zipPath, variant as 'work' | 'solution');
    if (!extractDir) return res.status(404).send('Failed to extract simulation');

    // Prüfen, ob index.html existiert
    const indexPath = path.join(extractDir, 'index.html');
    if (!fs.existsSync(indexPath)) return res.status(404).send('index.html not found');

    // Dynamischen Pfad einmalig registrieren
    const mountPath = `/simulation/${taskId}/${variant}`;
    if (!(req.app as any)._mountedSimulations) (req.app as any)._mountedSimulations = new Set<string>();
    if (!(req.app as any)._mountedSimulations.has(mountPath)) {
        (req.app as any)._mountedSimulations.add(mountPath);
        req.app.use(mountPath, express.static(extractDir));
    }

    res.redirect(`${mountPath}/index.html`);
});

// TMP-Ordner löschen (work + solution)
router.post('/:id/clear-tmp', async (req, res) => {
    const taskId = req.params.id;
    try {
        await deleteSimulationFolder(taskId, 'work');
        await deleteSimulationFolder(taskId, 'solution');
        res.status(200).json({ message: 'TMP folders deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete TMP folders' });
    }
});

// ----------------- Simulation Closed -----------------
router.post('/:id/simulation-closed/:variant', async (req, res) => {
    console.log("🔥 cleanup route HIT", req.params);

    const { id: taskId, variant } = req.params;
    if (variant !== 'work' && variant !== 'solution')
        return res.status(400).send('Invalid variant');

    const folderPath = path.join(__dirname, `../../tmp/simulations/${taskId}/${variant}`);
    scheduleCleanup(folderPath, `${taskId}_${variant}`);

    console.log(`🕑 Cleanup timer set for simulation ${taskId} (${variant})`);
    res.status(200).json({ message: 'Cleanup timer scheduled' });
});

// ----------------- Simulation Keepalive -----------------
router.post('/:id/simulation-keepalive/:variant', async (req, res) => {
    const { id: taskId, variant } = req.params;
    if (variant !== 'work' && variant !== 'solution')
        return res.status(400).send('Invalid variant');

    const folderPath = path.join(__dirname, `../../tmp/simulations/${taskId}/${variant}`);
    scheduleCleanup(folderPath, `${taskId}_${variant}`); // Timer wird resettet

    console.log(`💓 Keepalive received for simulation ${taskId} (${variant})`);
    res.status(200).json({ message: 'Keepalive OK' });
});



export default router;

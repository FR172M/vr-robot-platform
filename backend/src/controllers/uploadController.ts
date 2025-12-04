// src/controllers/uploadController.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../app';

// --- Upload Simulation (Work Variant) ---
export const uploadWorkSimulation = async (req: Request, res: Response) => {
    console.log("_______________uploading WorkSim_______________")

    const taskId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `/uploads/${taskId}/work/${req.file.originalname}`;

    try {
        await pool.query(
            'UPDATE tasks SET sim_work_path = $1 WHERE id = $2',
            [relativePath, taskId]
        );
        res.status(200).json({ message: 'Work simulation uploaded', path: relativePath });
        console.log(`_______________uploaded WorkSim to ${relativePath}_______________`)
    } catch (err) {
        console.error('❌ Fehler beim Speichern der Work-Sim in DB:', err);
        res.status(500).json({ error: 'Database update failed' });
    }
};

// --- Upload Simulation (Solution Variant) ---
export const uploadSolutionSimulation = async (req: Request, res: Response) => {
    console.log("_______________uploading SolSim_______________")

    const taskId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `/uploads/${taskId}/solution/${req.file.originalname}`;

    try {
        await pool.query(
            'UPDATE tasks SET sim_solution_path = $1 WHERE id = $2',
            [relativePath, taskId]
        );
        res.status(200).json({ message: 'Solution simulation uploaded', path: relativePath });
        console.log(`_______________uploaded SolSim to ${relativePath}_______________`)

    } catch (err) {
        console.error('❌ Fehler beim Speichern der Solution-Sim in DB:', err);
        res.status(500).json({ error: 'Database update failed' });
    }
};

// --- Upload PDF ---
export const uploadPdf = async (req: Request, res: Response) => {
    console.log("_______________uploading pdf_______________")
    const taskId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `/uploads/${taskId}/worksheet/${req.file.originalname}`;

    try {
        await pool.query(
            'UPDATE tasks SET worksheet_path = $1 WHERE id = $2',
            [relativePath, taskId]
        );
        res.status(200).json({ message: 'Worksheet uploaded', path: relativePath });
        console.log(`_______________uploaded pdf to ${relativePath}_______________`)

    } catch (err) {
        console.error('❌ Fehler beim Speichern des Worksheets in DB:', err);
        res.status(500).json({ error: 'Database update failed' });
    }
};

// --- Download Helper ---
const handleDownload = (res: Response, relativePath: string | null, label: string) => {
    if (!relativePath) {
        return res.status(404).send(`${label} not found`);
    }
    const fullPath = path.join(__dirname, '../public', relativePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).send(`${label} file missing`);
    }

    const filename = path.basename(fullPath);

    res.download(fullPath, filename, (err) => {
        if (err) {
            console.error(`❌ Error sending ${filename}:`, err);
        } else {
        }
    });
};

// --- Downloads ---
export const downloadWorkSimulation = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    try {
        const result = await pool.query('SELECT sim_work_path FROM tasks WHERE id = $1', [taskId]);
        handleDownload(res, result.rows[0]?.sim_work_path, 'Work simulation');
    } catch (err) {
        console.error('❌ Download Work failed:', err);
        res.status(500).send('Internal Server Error');
    }
};

export const downloadSolutionSimulation = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    try {
        const result = await pool.query('SELECT sim_solution_path FROM tasks WHERE id = $1', [taskId]);
        handleDownload(res, result.rows[0]?.sim_solution_path, 'Solution simulation');
    } catch (err) {
        console.error('❌ Download Solution failed:', err);
        res.status(500).send('Internal Server Error');
    }
};

export const downloadPdf = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    try {
        const result = await pool.query('SELECT worksheet_path FROM tasks WHERE id = $1', [taskId]);
        handleDownload(res, result.rows[0]?.worksheet_path, 'Worksheet');
    } catch (err) {
        console.error('❌ Download Worksheet failed:', err);
        res.status(500).send('Internal Server Error');
    }
};


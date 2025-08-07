// src/controllers/uploadController.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../db';

export const uploadSimulation = async (req: Request, res: Response) => {
    const taskId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `/uploads/${taskId}/${req.file.originalname}`;

    try {
        await pool.query(
            'UPDATE tasks SET simulation_path = $1 WHERE id = $2',
            [relativePath, taskId]
        );

        res.status(200).json({ message: 'Simulation uploaded', path: relativePath });
    } catch (err) {
        console.error('❌ Fehler beim Speichern des Pfads in der DB:', err);
        res.status(500).json({ error: 'Database update failed' });
    }
};


export const downloadSimulation = async (req: Request, res: Response) => {
    const taskId = req.params.id;

    try {
        const result = await pool.query(
            'SELECT simulation_path FROM tasks WHERE id = $1',
            [taskId]
        );

        if (result.rows.length === 0 || !result.rows[0].simulation_path) {
            return res.status(404).send('Simulation not found');
        }

        const relativePath = result.rows[0].simulation_path;
        const fullPath = path.join(__dirname, '../public', relativePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).send('Simulation file missing');
        }

        const filename = path.basename(fullPath);
        res.download(fullPath, filename);
    } catch (err) {
        console.error('❌ Download failed:', err);
        res.status(500).send('Internal Server Error');
    }
};

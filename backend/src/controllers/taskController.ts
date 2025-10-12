// backend/src/controllers/taskController.ts
import { Request, Response } from 'express';
import {createTask, getAllTasks, removeTask, updateTaskById} from '../models/Task';
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import fs from "fs";
import {query} from "../db";
import {dbRowToTask} from "../utils/taskMapper";

export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await getAllTasks();
        res.json(tasks);

    } catch (err) {
        console.error('❌ Failed to fetch tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(dbRowToTask(taskResult.rows[0]));
    } catch (err) {
        console.error('❌ Error fetching task by ID:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const postTask = async (req: Request, res: Response) => {
    try {
        console.log('📥 Incoming Task:', req.body); // Zeige, was empfangen wird

        const task = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...req.body,
        };

        console.log('🛠️ Composed Task:', task); // Zeige, was in DB geht

        await createTask(task);

        res.status(201).json({ message: 'Task created successfully', id: task.id });
    } catch (err) {
        console.error('taskController.ts: ❌ Error saving task:', err); // Vollständiges Error Logging
        res.status(500).json({ error: 'Failed to save task' });
    }
};


export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. DB-Eintrag löschen
        await removeTask(id);

        // 2. Upload-Ordner löschen
        const uploadDir = path.join(__dirname, '../public/uploads', id);
        if (fs.existsSync(uploadDir)) {
            fs.rmSync(uploadDir, { recursive: true, force: true });
            console.log(`🗑️ Upload folder deleted: ${uploadDir}`);
        }

        res.status(200).json({ message: 'Task and uploads deleted' });
    } catch (err) {
        console.error('❌ Delete failed:', err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedTask = req.body;
        await updateTaskById(id, updatedTask);
        res.status(200).json({ message: 'Task updated' });
    } catch (err) {
        console.error('❌ Update failed:', err);
        res.status(500).json({ error: 'Failed to update task' });
    }
};



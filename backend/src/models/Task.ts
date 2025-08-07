// backend/src/models/Task.ts
import { query } from '../db'; // ✅ Importiere den zentralen query-Helper


export interface Task {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    pseudocode: string;
    createdAt?: string;
    startDate?: string;
    dueDate?: string;
}


export const getAllTasks = async (): Promise<Task[]> => {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');

        return result.rows.map(task => ({
            ...task,
            start_date: task.start_date?.toString(), // gibt einfach '2025-07-24' zurück
            due_date: task.due_date?.toString(),
            created_at: task.created_at?.toISOString(), // Timestamp mit Uhrzeit bleibt so
        }));

};



export const createTask = async (task: Task): Promise<void> => {
    try {
        const {
            id,
            title,
            description,
            difficulty,
            pseudocode,
            createdAt,
            startDate,
            dueDate
        } = task;

        const createdAtISO = new Date(createdAt!).toISOString();

        await query(
            `INSERT INTO tasks 
            (id, title, description, difficulty, pseudocode, created_at, start_date, due_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                id,
                title,
                description,
                difficulty,
                pseudocode,
                createdAtISO,
                startDate ?? null,
                dueDate ?? null
            ]
        );
    } catch (err) {
        console.error('❌ createTask() failed:', err);
        throw err;
    }
};


export const removeTask = async (id: string): Promise<void> => {
    await query('DELETE FROM tasks WHERE id = $1', [id]);
};

export const updateTaskById = async (id: string, task: Partial<Task>): Promise<void> => {
    const { title, description, difficulty, pseudocode, startDate, dueDate } = task;
    await query(
        `UPDATE tasks 
         SET title = $1, description = $2, difficulty = $3, pseudocode = $4, start_date = $5, due_date = $6 
         WHERE id = $7`,
        [title, description, difficulty, pseudocode, startDate, dueDate, id]
    );
};



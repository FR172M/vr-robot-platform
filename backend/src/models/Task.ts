// backend/src/models/Task.ts
import { query } from '../db'; // ✅ Importiere den zentralen query-Helper
import { dbRowToTask } from '../utils/taskMapper';


export interface Task {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    pseudocode: string;
    createdAt?: string;
    startDate?: string;
    dueDate?: string;
    sampleSolution?: string;
    worksheetPath?: string | null;
    simWorkPath?: string | null;
    simSolutionPath?: string | null;
}


export const getAllTasks = async (): Promise<Task[]> => {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows.map(dbRowToTask);
};

export const createTask = async (task: Task): Promise<void> => {
    const {
        id,
        title,
        description,
        difficulty,
        pseudocode,
        sampleSolution,
        worksheetPath,      // ✅ nur noch worksheetPath
        simWorkPath,
        simSolutionPath,
        createdAt,
        startDate,
        dueDate
    } = task;

    const createdAtISO = new Date(createdAt!).toISOString();

    await query(
        `INSERT INTO tasks
         (id, title, description, difficulty, pseudocode, sample_solution,
          worksheet_path, sim_work_path, sim_solution_path, created_at, start_date, due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
            id,
            title,
            description,
            difficulty,
            pseudocode,
            sampleSolution,
            worksheetPath,   // ✅ mapped zu DB-Feld worksheet_path
            simWorkPath,
            simSolutionPath,
            createdAtISO,
            startDate,
            dueDate
        ]
    );
};


export const removeTask = async (id: string): Promise<void> => {
    await query('DELETE FROM tasks WHERE id = $1', [id]);
};

export const updateTaskById = async (id: string, patch: Partial<Task>): Promise<void> => {
    const fieldMap: Record<keyof Task, string> = {
        id: 'id',
        title: 'title',
        description: 'description',
        difficulty: 'difficulty',
        pseudocode: 'pseudocode',
        sampleSolution: 'sample_solution',
        worksheetPath: 'worksheet_path',
        simWorkPath: 'sim_work_path',
        simSolutionPath: 'sim_solution_path',
        createdAt: 'created_at',
        startDate: 'start_date',
        dueDate: 'due_date',
    };

    const keys = (Object.keys(patch) as (keyof Task)[])
        .filter((k) => patch[k] !== undefined && k !== 'id');

    if (keys.length === 0) return;

    const setClauses = keys.map((k, i) => `${fieldMap[k]} = $${i + 1}`);
    const values = keys.map((k) => {
        if ((k === 'createdAt' || k === 'startDate' || k === 'dueDate') && patch[k]) {
            return new Date(String(patch[k])).toISOString();
        }
        return patch[k] as any;
    });

    const sql = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1}`;
    await query(sql, [...values, id]);
};




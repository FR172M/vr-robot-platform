// backend/src/controllers/solutionController.ts
import {Request, Response} from 'express';
import {Pool} from 'pg';
import {getUser} from '../auth/utils'; // Utility-Funktion für sicheren Zugriff auf req.user
import { v4 as uuidv4 } from 'uuid';
import {pool} from "../app";


// POST /api/solutions
export const createOrStartSolution = async (req: Request, res: Response) => {
    try {
        const user = getUser(req);
        const { task_id } = req.body;

        // Prüfen, ob Eintrag existiert
        const existing = await pool.query(
            `SELECT *
             FROM task_solutions
             WHERE user_id = $1
               AND task_id = $2`,
            [user.id, task_id] // ✅ user.id hier, nicht uuidv4()
        );

        if (existing.rows.length > 0) {
            const updated = await pool.query(
                `UPDATE task_solutions
                 SET status = 'started',
                     started_at = COALESCE(started_at, NOW()),
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [existing.rows[0].id]
            );

            return res.json(updated.rows[0]);
        }

        // Neue Lösung anlegen → id mit uuidv4 generieren, user_id korrekt
        const insert = await pool.query(
            `INSERT INTO task_solutions (id, user_id, task_id, status, started_at, updated_at)
             VALUES ($1, $2, $3, 'started', NOW(), NOW())
             RETURNING *`,
            [uuidv4(), user.id, task_id] // ✅ uuidv4() für die Lösung-ID, nicht für user_id
        );

        return res.json(insert.rows[0]);
    } catch (err) {
        console.error('❌ createOrStartSolution error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create or start solution' });
    }
};


// PUT /api/solutions/:solutionId
export const updateSolution = async (req: Request, res: Response) => {
    try {
        const {solutionId} = req.params;
        const {code, submit} = req.body;

        if (submit === true) {
            const q = await pool.query(
                `UPDATE task_solutions
                 SET code         = $1,
                     status       = 'submitted',
                     submitted_at = NOW()
                 WHERE id = $2 RETURNING *`,
                [code, solutionId]
            );
            return res.json(q.rows[0]);
        }

        const q = await pool.query(
            `UPDATE task_solutions
             SET code   = $1,
                 status = 'started'
             WHERE id = $2 RETURNING *`,
            [code, solutionId]
        );

        res.json(q.rows[0]);
    } catch (err) {
        console.error('❌ updateSolution error:', err);
        res.status(500).json({error: err instanceof Error ? err.message : 'Failed to update solution'});
    }
};

// GET /api/solutions/me/:taskId
export const getMySolutionForTask = async (req: Request, res: Response) => {
    try {
        const user = getUser(req);
        const {taskId} = req.params;

        const q = await pool.query(
            `SELECT *
             FROM task_solutions
             WHERE user_id = $1
               AND task_id = $2`,
            [user.id, taskId]
        );

        res.json(q.rows[0] || null);
    } catch (err) {
        console.error('❌ getMySolutionForTask error:', err);
        res.status(500).json({error: err instanceof Error ? err.message : 'Failed to load solution'});
    }
};


// GET /api/solutions/task/:taskId
    export const getAllSolutionsForTask = async (req: Request, res: Response) => {
        try {
            const {taskId} = req.params;

            const q = await pool.query(
                `SELECT ts.*, u.email, u.username
                 FROM task_solutions ts
                          JOIN users u ON ts.user_id = u.id
                 WHERE ts.task_id = $1
                 ORDER BY ts.submitted_at DESC NULLS LAST`,
                [taskId]
            );

            res.json(q.rows);
        } catch (err) {
            console.error('❌ getAllSolutionsForTask error:', err);
            res.status(500).json({error: err instanceof Error ? err.message : 'Failed to load solutions'});
        }
    };


    // Post Grade and Feedback+
export const updateGrade = async (req: Request, res: Response) => {
    try {
        const { solutionId } = req.params;
        let { grade, feedback } = req.body as { grade?: string | null; feedback?: string | null };

        let gradeNumber: number | null = null;

        if (typeof grade === 'string' && grade?.trim() !== '') {
            gradeNumber = Number(grade);
            if (isNaN(gradeNumber)) {
                return res.status(400).json({ error: 'Grade must be numeric' });
            }
        }

        let newStatus: string | null = null;
        if (gradeNumber !== null) {
            newStatus = gradeNumber === 5 ? 'not passed' : 'passed';
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (gradeNumber !== null) {
            fields.push(`grade = $${fields.length + 1}`);
            values.push(gradeNumber);
        }

        if (feedback !== undefined && feedback !== null) {
            fields.push(`feedback = $${fields.length + 1}`);
            values.push(feedback);
        }

        if (newStatus !== null) {
            fields.push(`status = $${fields.length + 1}`);
            values.push(newStatus);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(solutionId);

        const q = await pool.query(
            `UPDATE task_solutions SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *;`,
            values
        );

        return res.json(q.rows[0]);


    } catch (err) {
        console.error('❌ updateGrade error:', err);
        res.status(500).json({ error: 'Failed to update grade' });
    }
};

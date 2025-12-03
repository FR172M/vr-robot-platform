import { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// GET /api/users?role=student
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const role = req.query.role as string | undefined;

        let q;
        if (role) {
            q = await pool.query(
                'SELECT id, email, role, created_at, username FROM users WHERE role = $1 ORDER BY created_at DESC',
                [role]
            );
        } else {
            q = await pool.query(
                'SELECT id, email, role, created_at, username FROM users ORDER BY created_at DESC'
            );
        }

        res.json(q.rows);

    } catch (err) {
        console.error('❌ getAllUsers error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch users' });
    }
};


// Einzelnen User abrufen
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const q = await pool.query(
            'SELECT id, email, role, created_at, username FROM users WHERE id = $1',
            [id]
        );
        if (!q.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(q.rows[0]);
    } catch (err) {
        console.error('❌ getUserById error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch user' });
    }
};

// Rolle ändern
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const q = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, username',
            [role, id]
        );

        if (!q.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(q.rows[0]);
    } catch (err) {
        console.error('❌ updateUserRole error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update role' });
    }
};


// User registrieren
import bcrypt from 'bcrypt';

export const registerUser = async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ error: "Missing username, email or password" });

    try {
        const userCheck = await pool.query('SELECT id FROM public.users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0)
            return res.status(409).json({ error: "Email already registered" });

        // Passwort mit bcrypt hashen
        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO public.users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4)`,
            [username, email, hash, role || 'student']
        );

        const newUserRes = await pool.query(
            'SELECT username, email, role FROM public.users WHERE email = $1',
            [email]
        );
        const newUser = newUserRes.rows[0];

        return res.status(201).json({ user: newUser });

    } catch (err) {
        console.error("Registration error details:", err);
        return res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
    }
};


// User löschen
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const q = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

        if (!q.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json({ message: `User ${q.rows[0].email} deleted successfully` });
    } catch (err) {
        console.error('❌ deleteUser error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete user' });
    }
};

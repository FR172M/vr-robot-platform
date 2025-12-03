// backend/src/controllers/loginController.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from "bcrypt";

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Typdefinition für Request mit User
export type AuthRequest = Request & {
    user?: { id: string; role: string; email: string; username: string };
};

// Utility: garantiert user
export const getUser = (req: AuthRequest) => {
    if (!req.user) throw new Error('User not authenticated');
    return req.user;
};

// --- Login ---
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
    }

    try {
        const dbRes = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        const user = dbRes.rows[0];
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        });

        return res.json({
            message: "Login erfolgreich",
            role: user.role,
            email: user.email,
            username: user.username,
        });
    } catch (err) {
        console.error("Login error details:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

// --- Token-Authentifizierung aus Cookie ---
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Token missing" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string; email: string; username: string };
        const dbRes = await pool.query(
            'SELECT id, email, username, role FROM public.users WHERE id = $1',
            [payload.id]
        );

        if (dbRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

        req.user = dbRes.rows[0];
        next();
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: "Invalid token" });
    }
};

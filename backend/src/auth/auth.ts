// src/auth/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: string;
    role: string;
    username: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; // optional, TS meckert nicht
        }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Token fehlt' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'JWT_SECRET nicht gesetzt' });
    }

    try {
        const payload = jwt.verify(token, secret) as JwtPayload;
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token ungültig' });
    }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Nicht autorisiert' });
        }
        next();
    };
};

// src/auth/utils.ts
import { Request } from 'express';
import { JwtPayload } from './auth';

export const getUser = (req: Request): JwtPayload => {
    if (!req.user) throw new Error('User ist nicht authentifiziert');
    return req.user;
};

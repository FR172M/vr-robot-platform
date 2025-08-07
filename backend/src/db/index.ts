// backend/src/db/indes.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('📦 DB config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
});

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// backend/src/seed/seedUsers.ts
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db';
import bcrypt from 'bcrypt';

const seedUsers = async () => {
    try {
        console.log('🌱 Seeding users...');

        // Ensure table exists
        await query(`
                CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                username VARCHAR(50)
                );
        `);

        console.log('🧱 Table "users" ensured');

        // Clean tables
        await query(`DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_solutions') THEN
       DELETE FROM task_solutions;
   END IF;
END $$;
`);
        await query('DELETE FROM users');
        console.log('🗑️  All users deleted');

        // User list
        const users = [
            // Teachers
            {
                email: 'teacher@tu-dresden.de',
                password: 'Testing1Teacher',
                role: 'teacher',
                username: 'Sample Teacher'
            },
            {
                email: 'julia.schneider@tu-dresden.de',
                password: 'Testing1Teacher',
                role: 'teacher',
                username: 'Julia Schneider'
            },
            {
                email: 'thomas.meier@tu-dresden.de',
                password: 'Testing1Teacher',
                role: 'teacher',
                username: 'Thomas Meier'
            },
            {
                email: 'katharina.vogt@tu-dresden.de',
                password: 'Testing1Teacher',
                role: 'teacher',
                username: 'Katharina Vogt'
            },

            // Students
            {
                email: 'student@tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Sample Student'
            },
            {
                email: 'lena.hofmann@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Lena Hofmann'
            },
            {
                email: 'moritz.keller@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Moritz Keller'
            },
            {
                email: 'lea.schubert@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Lea Schubert'
            },
            {
                email: 'jannis.richter@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Jannis Richter'
            },
            {
                email: 'luisa.krause@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Luisa Krause'
            },
            {
                email: 'jakob.wolf@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Jakob Wolf'
            },
            {
                email: 'sarah.pohl@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Sarah Pohl'
            },
            {
                email: 'emil.lehmann@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Emil Lehmann'
            },
            {
                email: 'clara.weiss@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Clara Weiss'
            },
            {
                email: 'lukas.berner@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Lukas Berner'
            },
            {
                email: 'mira.franke@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Mira Franke'
            },
            {
                email: 'fabian.arnold@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Fabian Arnold'
            },
            {
                email: 'lina.schmidt@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Lina Schmidt'
            },
            {
                email: 'noah.brandt@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Noah Brandt'
            },
            {
                email: 'josefine.hein@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Josefine Hein'
            },
            {
                email: 'malte.krueger@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Malte Krueger'
            },
            {
                email: 'tamara.fischer@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Tamara Fischer'
            },
            {
                email: 'johannes.otto@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Johannes Otto'
            },
            {
                email: 'alex.schaefer@mailbox.tu-dresden.de',
                password: 'Testing1Student',
                role: 'student',
                username: 'Alex Schaefer'
            }
        ];

        // Insert users
        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 10);

            await query(
                `INSERT INTO users (email, password_hash, role, username)
                 VALUES ($1, $2, $3, $4)`,
                [u.email, hash, u.role, u.username]
            );

            console.log(`👤 User "${u.email}" (${u.role}) inserted.`);
        }

        console.log(`✅ Seeded ${users.length} users successfully`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedUsers();

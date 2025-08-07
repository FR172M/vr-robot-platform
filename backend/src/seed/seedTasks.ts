// backend/src/seed/seedTasks.ts
import dotenv from 'dotenv';
dotenv.config(); // <--- GANZ OBEN, vor allen DB-Zugriffen

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';


const createZipFromFolder = (sourceFolder: string, zipPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`📦 Created ZIP file (${archive.pointer()} bytes): ${zipPath}`);
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
};


const seedTasks = async () => {
    try {
        console.log('🌱 Seeding tasks...');

        // 1. Alle Tasks löschen
        await query('DELETE FROM tasks');
        console.log('🗑️  All tasks deleted');
        const uploadBasePath = path.join(__dirname, '../public/uploads');
        if (fs.existsSync(uploadBasePath)) {
            fs.rmSync(uploadBasePath, { recursive: true, force: true });
            console.log('🧹 All uploaded simulations deleted');
        }

        const today = dayjs().startOf('day');

        const tasks = [
            {
                title: 'Current Task 1',
                startDate: today.subtract(2, 'day'),
                dueDate: today.add(2, 'day'),
                difficulty: 'Medium',
                description: 'Ongoing task 1',
                pseudocode: 'runCurrent1();'
            },
            {
                title: 'Current Task 2',
                startDate: today.subtract(1, 'day'),
                dueDate: today.add(5, 'day'),
                difficulty: 'Easy',
                description: 'Ongoing task 2',
                pseudocode: 'runCurrent2();'
            },
            {
                title: 'Upcoming Task 1',
                startDate: today.add(1, 'day'),
                dueDate: today.add(4, 'day'),
                difficulty: 'Hard',
                description: 'Task that starts tomorrow',
                pseudocode: 'runFuture1();'
            },
            {
                title: 'Upcoming Task 2',
                startDate: today.add(3, 'day'),
                dueDate: today.add(7, 'day'),
                difficulty: 'Medium',
                description: 'Future task',
                pseudocode: 'runFuture2();'
            },
            {
                title: 'Past Task 1',
                startDate: today.subtract(7, 'day'),
                dueDate: today.subtract(2, 'day'),
                difficulty: 'Hard',
                description: 'Old task',
                pseudocode: 'runOld1();'
            },
            {
                title: 'Past Task 2',
                startDate: today.subtract(10, 'day'),
                dueDate: today.subtract(3, 'day'),
                difficulty: 'Easy',
                description: 'Old task 2',
                pseudocode: 'runOld2();'
            }
        ];

        const dummyFilePath = path.join(__dirname, 'example_simulation.zip');

        // Dummy-Datei erzeugen falls nicht vorhanden
        if (!fs.existsSync(dummyFilePath)) {
            await createZipFromFolder(
                path.join(__dirname, 'simulation_template'),
                dummyFilePath
            );
        }



        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const id = uuidv4();
            const createdAt = dayjs().toISOString();
            const start = task.startDate.format('YYYY-MM-DD');
            const due = task.dueDate.format('YYYY-MM-DD');

            // Pfad für Upload-Datei
            const fileName = `simulation_${i + 1}.zip`;
            const uploadDir = path.join(__dirname, '../public/uploads', id);
            const targetFilePath = path.join(uploadDir, fileName);
            const relativeSimulationPath = `/uploads/${id}/${fileName}`;

            // Ordner anlegen + Dummy-Datei kopieren
            fs.mkdirSync(uploadDir, { recursive: true });
            fs.copyFileSync(dummyFilePath, targetFilePath);

            // Task mit simulation_path speichern
            await query(
                `INSERT INTO tasks (id, title, description, difficulty, pseudocode, created_at, start_date, due_date, simulation_path)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    id,
                    task.title,
                    task.description,
                    task.difficulty,
                    task.pseudocode,
                    createdAt,
                    start,
                    due,
                    relativeSimulationPath
                ]
            );

            console.log(`📁 Task ${task.title} seeded with simulation: ${fileName}`);
        }

        console.log(`✅ Seeded ${tasks.length} tasks successfully`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedTasks();

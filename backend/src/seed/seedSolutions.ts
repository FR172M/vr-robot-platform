
import { query } from '../app';
import { v4 as uuidv4 } from 'uuid';

const randomPastDate = (before: Date) =>
    new Date(before.getTime() - Math.random() * 5 * 24 * 3600 * 1000);

const randomBetween = (a: Date, b: Date) =>
    new Date(a.getTime() + Math.random() * (b.getTime() - a.getTime()));

const seedSolutions = async () => {
    try {
        console.log('🌱 Seeding task_solutions...');

        await query(`

        CREATE TABLE IF NOT EXISTS task_solutions (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            task_id UUID REFERENCES tasks(id),
            status TEXT,
            started_at TIMESTAMP,
            submitted_at TIMESTAMP,
            updated_at TIMESTAMP,
            code TEXT,
            passed BOOLEAN,
            grade NUMERIC,
            feedback TEXT,
            source_language TEXT,
            metadata JSONB
    );
        `);
        console.log('🧱 Table "task_solutions" ensured');


        await query(`DELETE FROM task_solutions`);
        console.log('🗑️  Cleared task_solutions');

        const users = (await query(
            `SELECT id FROM users WHERE role='student' ORDER BY created_at ASC`
        )).rows;

        const tasks = (await query(`
            SELECT id, start_date, due_date
            FROM tasks
            ORDER BY start_date ASC
        `)).rows;

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start-of-Day

        const previous = tasks.filter(t => new Date(t.due_date) < now);
        const current = tasks.filter(t => new Date(t.start_date) <= now && new Date(t.due_date) >= now);


        const entries = [];

        for (const user of users) {
            // ensure at least one current task unworked
            const untouchedIndex = Math.floor(Math.random() * current.length);

            for (const task of previous) {
                const due = new Date(task.due_date);
                const start = new Date(task.start_date);
                const started = randomBetween(start, due);
                const submitted = randomPastDate(due);
                const updated = randomBetween(started, submitted)

                // zwingend einen Status picken: 0=not submitted, 1=pending, 2=passed, 3=not passed,
                const pick = Math.floor(Math.random() * 4);

                if (pick === 0) {
                    // not submitted
                    entries.push({
                        id: uuidv4(),
                        userId: user.id,
                        taskId: task.id,
                        status: 'not submitted',
                        started_at: null,
                        submitted_at: null,
                        updated_at: null,
                        code: null,
                        passed: false,
                        grade: 5.0,
                        feedback: 'Do your work next time!'
                    });
                }else if(pick === 1){

                    // pending
                    entries.push({
                        id: uuidv4(),
                        userId: user.id,
                        taskId: task.id,
                        status: 'pending',
                        started_at: started,
                        submitted_at: submitted,
                        updated_at: updated,
                        code: `def run():\n    print("pending")`,
                        passed: null,
                        grade: null,
                        feedback: 'I will grade your work soon!'
                    });
                } else {
                    // passed oder not passed
                    const passed = pick === 2;

                    entries.push({
                        id: uuidv4(),
                        userId: user.id,
                        taskId: task.id,
                        status: passed ? 'passed' : 'not passed',
                        started_at: started,
                        submitted_at: submitted,
                        updated_at: updated,
                        code: `def run():\n    print("submitted")`,
                        passed,
                        grade: passed ? Number((Math.random() * 3 + 1).toFixed(1)) : 5.0,
                        feedback: passed ? 'Well done.' : 'Needs improvement.'
                    });
                }
            }

            for (let i = 0; i < current.length; i++) {
                const task = current[i];
                const start = new Date(task.start_date);
                const due = new Date(task.due_date);

                // untouched — no entry
                if (i === untouchedIndex) continue;

                const pick = Math.floor(Math.random() * 2); // 0 started, 1 submitted

                if (pick === 0) {
                    // started
                    const started = randomBetween(start, now);
                    const updated = randomBetween(started, now);

                    entries.push({
                        id: uuidv4(),
                        userId: user.id,
                        taskId: task.id,
                        status: 'started',
                        started_at: started,
                        submitted_at: null,
                        updated_at: updated,
                        code: `def run():\n    print("working...")`,
                        passed: null,
                        grade: null,
                        feedback: null
                    });
                } else {
                    // submitted
                    const started = randomBetween(start, now);
                    const submitted = randomBetween(started, now);

                    entries.push({
                        id: uuidv4(),
                        userId: user.id,
                        taskId: task.id,
                        status: 'submitted',
                        started_at: started,
                        submitted_at: submitted,
                        updated_at: submitted,
                        code: `def run():\n    print("submitted!")`,
                        passed: null,
                        grade: null,
                        feedback: null
                    });
                }
            }
        }

        for (const e of entries) {
            await query(
                `INSERT INTO task_solutions
                    (id, user_id, task_id, status, started_at, submitted_at, updated_at,
                     code, passed, grade, feedback, source_language, metadata)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'python','{"seeded":true}')`,
                [
                    e.id,
                    e.userId,
                    e.taskId,
                    e.status,
                    e.started_at,
                    e.submitted_at,
                    e.updated_at,
                    e.code,
                    e.passed,
                    e.grade,
                    e.feedback
                ]
            );
        }

        console.log(`✅ Inserted ${entries.length} task_solutions`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedSolutions();

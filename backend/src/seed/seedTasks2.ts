// backend/src/seed/seedTasks.ts
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import dayjs, { Dayjs } from 'dayjs';
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

const seedTasks = async (): Promise<void> => {
    try {
        console.log('🌱 Seeding tasks...');

        await query('DELETE FROM tasks');
        console.log('🗑️  All tasks deleted');

        const uploadBasePath = path.join(__dirname, '../public/uploads');
        if (fs.existsSync(uploadBasePath)) {
            fs.rmSync(uploadBasePath, { recursive: true, force: true });
            console.log('🧹 All uploaded simulations deleted');
        }

        // Typisierte Variablen
        const today: Dayjs = dayjs().startOf('day');
        const tomorrow: Dayjs = today.add(1, 'day');
        const inTwoDays: Dayjs = today.add(2, 'day');
        const inThreeDays: Dayjs = today.add(3, 'day');
        const inFourDays: Dayjs = today.add(4, 'day');
        const inFiveDays: Dayjs = today.add(5, 'day');
        const inSixDays: Dayjs = today.add(6, 'day');
        const inSevenDays: Dayjs = today.add(7, 'day');
        const inEightDays: Dayjs = today.add(8, 'day');
        const inFifteenDays: Dayjs = today.add(15, 'day');
        const inTwentyDays: Dayjs = today.add(20, 'day');
        const inOneMonth: Dayjs = today.add(30, 'day');
        const inOneMonthPlusFive: Dayjs = inOneMonth.add(5, 'day');
        const inOneMonthPlusSeven: Dayjs = inOneMonth.add(7, 'day');
        const inOneMonthPlusTen: Dayjs = inOneMonth.add(10, 'day');

        const yesterday: Dayjs = today.subtract(1, 'day');
        const twoDaysAgo: Dayjs = today.subtract(2, 'day');
        const threeDaysAgo: Dayjs = today.subtract(3, 'day');
        const fourDaysAgo: Dayjs = today.subtract(4, 'day');
        const fiveDaysAgo: Dayjs = today.subtract(5, 'day');
        const sixDaysAgo: Dayjs = today.subtract(6, 'day');
        const sevenDaysAgo: Dayjs = today.subtract(7, 'day');
        const eightDaysAgo: Dayjs = today.subtract(8, 'day');
        const tenDaysAgo: Dayjs = today.subtract(10, 'day');

        const tasks = [
            // Previous (7: 4 Easy, 2 Medium, 1 Hard)
            {
                title: 'Robot Arm Calibration',
                startDate: tenDaysAgo,
                dueDate: sixDaysAgo,
                difficulty: 'Easy',
                description: 'Calibrate the robot arm to pick up objects precisely.',
                pseudocode: 'calibrateArm(); pickUpObject();'
            },
            {
                title: 'Basic Movement Sequence',
                startDate: sixDaysAgo,
                dueDate: fiveDaysAgo,
                difficulty: 'Easy',
                description: 'Program the robot to move forward and turn right.',
                pseudocode: 'moveForward(); turnRight();'
            },
            {
                title: 'LED Signal Pattern',
                startDate: eightDaysAgo,
                dueDate: fourDaysAgo,
                difficulty: 'Easy',
                description: 'Program LED lights to blink in a specific pattern.',
                pseudocode: 'blinkLED(pattern1);'
            },
            {
                title: 'Safety Protocol Check',
                startDate: sevenDaysAgo,
                dueDate: yesterday,
                difficulty: 'Easy',
                description: 'Verify safety protocols before robot activation.',
                pseudocode: 'checkSensors(); verifyShutdown();'
            },
            {
                title: 'Multi-Sensor Fusion',
                startDate: fiveDaysAgo,
                dueDate: yesterday,
                difficulty: 'Medium',
                description: 'Combine sensor data for accurate environment mapping.',
                pseudocode: 'readSensors(); fuseData(); mapEnvironment();'
            },
            {
                title: 'Battery Optimization',
                startDate: sevenDaysAgo,
                dueDate: twoDaysAgo,
                difficulty: 'Medium',
                description: 'Optimize battery consumption during idle times.',
                pseudocode: 'monitorBattery(); reducePower();'
            },
            {
                title: 'Autonomous Navigation with SLAM',
                startDate: tenDaysAgo,
                dueDate: threeDaysAgo,
                difficulty: 'Hard',
                description: 'Implement SLAM for autonomous environment mapping.',
                pseudocode: 'initSLAM(); updateMap(); planRoute();'
            },

            // Current (7)
            {
                title: 'Pick and Place Routine',
                startDate: yesterday,
                dueDate: today,
                difficulty: 'Medium',
                description: 'Pick up an object and place it on a designated spot.',
                pseudocode: 'pickObject(); moveToLocation(); placeObject();'
            },
            {
                title: 'Simple Obstacle Avoidance',
                startDate: yesterday,
                dueDate: tomorrow,
                difficulty: 'Easy',
                description: 'Avoid obstacles using front sensors.',
                pseudocode: 'detectObstacle(); avoidObstacle();'
            },
            {
                title: 'Basic Speech Recognition',
                startDate: today,
                dueDate: inSevenDays,
                difficulty: 'Medium',
                description: 'Implement voice commands to start and stop the robot.',
                pseudocode: 'listenCommand(); executeCommand();'
            },
            {
                title: 'Robotic Arm Inverse Kinematics',
                startDate: yesterday,
                dueDate: inTwoDays,
                difficulty: 'Hard',
                description: 'Calculate joint angles for desired end-effector position.',
                pseudocode: 'calculateIK(targetPosition); moveArm();'
            },
            {
                title: 'Multi-Robot Coordination',
                startDate: today,
                dueDate: inThreeDays,
                difficulty: 'Hard',
                description: 'Coordinate multiple robots to complete tasks collaboratively.',
                pseudocode: 'syncRobots(); assignTasks();'
            },
            {
                title: 'Line Following',
                startDate: today,
                dueDate: inFiveDays,
                difficulty: 'Easy',
                description: 'Make the robot follow a black line on the floor.',
                pseudocode: 'followLine();'
            },
            {
                title: 'Path Planning in Maze',
                startDate: yesterday,
                dueDate: inSixDays,
                difficulty: 'Medium',
                description: 'Navigate the robot through a maze to reach the goal.',
                pseudocode: 'planPath(); navigateMaze();'
            },

            // Upcoming (12)
            {
                title: 'Advanced Sensor Calibration',
                startDate: inOneMonth,
                dueDate: inOneMonthPlusFive,
                difficulty: 'Easy',
                description: 'Calibrate multiple sensors for improved accuracy.',
                pseudocode: 'calibrateSensors(); verifyAccuracy();'
            },
            {
                title: 'LED Signal Patterns Extended',
                startDate: inFourDays,
                dueDate: inOneMonth,
                difficulty: 'Easy',
                description: 'Develop complex LED blinking sequences for notifications.',
                pseudocode: 'blinkLED(patternExtended);'
            },
            {
                title: 'Basic Emergency Stop',
                startDate: tomorrow,
                dueDate: inOneMonthPlusSeven,
                difficulty: 'Easy',
                description: 'Implement emergency stop triggered by external signal.',
                pseudocode: 'checkEmergencySignal(); stopRobot();'
            },
            {
                title: 'Robotic Voice Assistant',
                startDate: inTwoDays,
                dueDate: inSevenDays,
                difficulty: 'Medium',
                description: 'Implement voice assistant for robot commands.',
                pseudocode: 'voiceRecognition(); executeCommands();'
            },
            {
                title: 'Precision Gripper Control',
                startDate: inEightDays,
                dueDate: inSevenDays.add(1, 'day'),
                difficulty: 'Medium',
                description: 'Control the gripper to pick up fragile objects carefully.',
                pseudocode: 'gripSoftly(); liftObject();'
            },
            {
                title: 'Gesture Controlled Robot',
                startDate: inEightDays.add(1, 'day'),
                dueDate: inOneMonth,
                difficulty: 'Medium',
                description: 'Control the robot using hand gestures.',
                pseudocode: 'detectGestures(); controlRobot();'
            },
            {
                title: 'Energy Efficient Pathfinding',
                startDate: inFifteenDays,
                dueDate: inOneMonth.add(1, 'day'),
                difficulty: 'Medium',
                description: 'Optimize robot paths for minimal energy consumption.',
                pseudocode: 'calculateEnergyPaths(); optimizeRoute();'
            },
            {
                title: 'Advanced SLAM Optimization',
                startDate: inTwentyDays,
                dueDate: inOneMonth.add(2, 'day'),
                difficulty: 'Hard',
                description: 'Improve SLAM algorithms for faster mapping.',
                pseudocode: 'optimizeSLAM(); fastMapping();'
            },
            {
                title: 'Real-Time Object Recognition',
                startDate: tomorrow,
                dueDate: inOneMonth.add(3, 'day'),
                difficulty: 'Hard',
                description: 'Use camera data to recognize and classify objects.',
                pseudocode: 'captureImage(); classifyObject();'
            },
            {
                title: 'Dynamic Obstacle Avoidance',
                startDate: inEightDays.add(2, 'day'),
                dueDate: inOneMonth.add(4, 'day'),
                difficulty: 'Hard',
                description: 'Avoid moving obstacles in real-time.',
                pseudocode: 'detectDynamicObstacle(); adjustPath();'
            },
            {
                title: 'Collaborative Object Transport',
                startDate: inFifteenDays.add(1, 'day'),
                dueDate: inOneMonthPlusTen,
                difficulty: 'Hard',
                description: 'Coordinate multiple robots to carry objects together.',
                pseudocode: 'syncRobots(); carryObject();'
            },
            {
                title: 'Autonomous Drone Navigation',
                startDate: inTwentyDays.add(1, 'day'),
                dueDate: inOneMonthPlusSeven,
                difficulty: 'Hard',
                description: 'Program a drone to navigate autonomously indoors.',
                pseudocode: 'initDrone(); navigateIndoors();'
            }
        ];

        const dummyFilePath = path.join(__dirname, 'example_simulation.zip');

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

            const fileName = `simulation_${i + 1}.zip`;
            const uploadDir = path.join(__dirname, '../public/uploads', id);
            const targetFilePath = path.join(uploadDir, fileName);
            const relativeSimulationPath = `/uploads/${id}/${fileName}`;

            fs.mkdirSync(uploadDir, { recursive: true });
            fs.copyFileSync(dummyFilePath, targetFilePath);

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

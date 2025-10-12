// backend/src/utils/testTmpSimulationManager.ts

import path from 'path';
import fs from 'fs';
import {
    cleanTmpOnStartup,
    getOrCreateSimulationFolder,
    deleteSimulationFolder,
    scheduleCleanup
} from './tmpSimulationManager';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDummyFile(folder: string, name: string, content: string) {
    const filePath = path.join(folder, name);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`✍️ Created dummy file: ${filePath}`);
}

/**
 * Lokale Hilfsfunktion, die scheduleCleanup mit kürzerem Delay (5s) simuliert.
 */
function scheduleCleanupTest(folderPath: string, key: string, delay: number = 5000) {
    console.log(`⏱️ Scheduled test cleanup in ${delay / 1000}s for: ${folderPath}`);

    setTimeout(async () => {
        try {
            if (fs.existsSync(folderPath)) {
                await fs.promises.rm(folderPath, { recursive: true, force: true });
                console.log(`🗑️ Test-cleaned tmp folder after inactivity: ${folderPath}`);
            } else {
                console.log(`ℹ️ Test-cleanup triggered, but folder already gone: ${folderPath}`);
            }
        } catch (err) {
            console.error('❌ Error during test cleanup:', folderPath, err);
        }
    }, delay);
}

async function runTests() {
    console.log('==============================');
    console.log('🚀 STARTING TMP MANAGER TESTS (5s DELAY)');
    console.log('==============================');

    console.log('\n--- Step 1: Clean on startup ---');
    await cleanTmpOnStartup();

    console.log('\n--- Step 2: Create folders ---');
    const workFolder = await getOrCreateSimulationFolder('task1', 'work');
    const solutionFolder = await getOrCreateSimulationFolder('task1', 'solution');
    await createDummyFile(workFolder, 'test.txt', 'Hello Work');
    await createDummyFile(solutionFolder, 'solution.txt', 'Hello Solution');

    console.log('\n--- Step 3: Schedule cleanup with 5s ---');
    scheduleCleanupTest(workFolder, 'task1_work_test', 5000);
    scheduleCleanupTest(solutionFolder, 'task1_solution_test', 5000);

    console.log('⏳ Waiting 6s so cleanup timers trigger...');
    await sleep(6000);

    console.log('\n--- Step 4: Delete manually ---');
    const manualFolder = await getOrCreateSimulationFolder('task2', 'work');
    await createDummyFile(manualFolder, 'keep.txt', 'This will be deleted manually');
    await deleteSimulationFolder('task2', 'work');

    console.log('\n--- Step 5: Final global cleanup ---');
    await cleanTmpOnStartup();

    console.log('\n==============================');
    console.log('✅ ALL TMP MANAGER TESTS DONE');
    console.log('==============================');
}

// Run tests
runTests().catch(err => console.error('❌ Test script error:', err));

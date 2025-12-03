// backend/src/utils/tmpSimulationManager.ts

import fs from 'fs';
import path from 'path';
import {TMP_BASE} from "./dockerRunner";

const CLEANUP_DELAY = 3 * 60 * 1000; // 3 Minuten
const cleanupTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Löscht leere Ordner rekursiv nach oben.
 */
async function cleanupEmptyParents(dir: string) {
    let current = dir;

    while (true) {
        try {
            const files = await fs.promises.readdir(current);
            if (files.length === 0) {
                await fs.promises.rmdir(current);
                console.log(`🗑️ Removed empty folder: ${current}`);
                current = path.dirname(current);
            } else {
                console.log(`📂 Folder not empty, stop: ${current} (contains: ${files.join(', ')})`);
                break;
            }
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                console.log(`ℹ️ Folder already gone: ${current}`);
                break;
            }
            console.error('❌ Error while cleaning empty parents:', current, err);
            break;
        }
    }
}

/**
 * Bereinigt beim Serverstart alle alten tmp-Ordner
 */
export async function cleanTmpOnStartup() {
    console.log('🚀 Cleaning TMP folders on startup...');
    if (!fs.existsSync(TMP_BASE)) {
        console.log(`ℹ️ TMP_BASE does not exist yet: ${TMP_BASE}`);
        return;
    }

    const tasks = await fs.promises.readdir(TMP_BASE);
    console.log(`📂 Found task folders in TMP_BASE: ${tasks.length ? tasks.join(', ') : '(none)'}`);

    for (const taskId of tasks) {
        const variantsPath = path.join(TMP_BASE, taskId);
        const variants = await fs.promises.readdir(variantsPath);
        console.log(`  📂 Task ${taskId}: variants = ${variants.length ? variants.join(', ') : '(none)'}`);

        for (const variant of variants) {
            const folderPath = path.join(variantsPath, variant);
            try {
                await fs.promises.rm(folderPath, { recursive: true, force: true });
                console.log(`    🗑️ Removed variant folder: ${folderPath}`);
                await cleanupEmptyParents(path.dirname(folderPath));
            } catch (err) {
                console.error('❌ Error cleaning tmp folder on startup:', folderPath, err);
            }
        }

        // sicherstellen, dass taskId-Ebene evtl. weg ist
        await cleanupEmptyParents(variantsPath);
    }

    // zuletzt evtl. auch TMP_BASE selbst bereinigen
    await cleanupEmptyParents(TMP_BASE);

    console.log('✅ Startup cleanup finished');
}

/**
 * Gibt den Pfad zum extrahierten Simulation-Ordner zurück.
 * Legt den Ordner an, wenn er noch nicht existiert.
 */
export async function getOrCreateSimulationFolder(taskId: string, variant: 'work' | 'solution'): Promise<string> {
    const folderPath = path.join(TMP_BASE, taskId, variant);
    if (!fs.existsSync(folderPath)) {
        await fs.promises.mkdir(folderPath, { recursive: true });
        console.log(`📂 Created folder: ${folderPath}`);
    } else {
        console.log(`ℹ️ Folder already exists: ${folderPath}`);
    }
    scheduleCleanup(folderPath, `${taskId}_${variant}`);
    return folderPath;
}

/**
 * Startet bzw. resettet einen Cleanup-Timer für den Ordner
 */
export function scheduleCleanup(folderPath: string, key: string) {
    if (cleanupTimers[key]) {
        clearTimeout(cleanupTimers[key]);
        console.log(`⏱️ Reset cleanup timer for: ${folderPath}`);
    } else {
        console.log(`⏱️ Started cleanup timer for: ${folderPath}`);
    }

    cleanupTimers[key] = setTimeout(async () => {
        try {
            if (fs.existsSync(folderPath)) {
                await fs.promises.rm(folderPath, { recursive: true, force: true });
                console.log(`🗑️ Cleaned tmp folder after inactivity: ${folderPath}`);
                await cleanupEmptyParents(path.dirname(folderPath));
            } else {
                console.log(`ℹ️ Cleanup timer triggered, but folder already gone: ${folderPath}`);
            }
        } catch (err) {
            console.error('❌ Error cleaning tmp folder:', folderPath, err);
        } finally {
            delete cleanupTimers[key];
        }
    }, CLEANUP_DELAY);
}

/**
 * Optional: löscht einen Ordner sofort (z.B. bei manuellem Entfernen)
 */
export async function deleteSimulationFolder(taskId: string, variant: 'work' | 'solution') {
    const folderPath = path.join(TMP_BASE, taskId, variant);
    const timerKey = `${taskId}_${variant}`;

    if (cleanupTimers[timerKey]) {
        clearTimeout(cleanupTimers[timerKey]);
        delete cleanupTimers[timerKey];
        console.log(`⏹️ Stopped cleanup timer for: ${folderPath}`);
    }

    if (fs.existsSync(folderPath)) {
        await fs.promises.rm(folderPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted simulation folder: ${folderPath}`);
        await cleanupEmptyParents(path.dirname(folderPath));
    } else {
        console.log(`ℹ️ Tried to delete, but folder not found: ${folderPath}`);
    }
}

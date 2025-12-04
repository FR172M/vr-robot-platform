import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { pool } from '../app';
import { getOrCreateSimulationFolder, scheduleCleanup } from './tmpSimulationManager';

export async function getSimulationZipPath(taskId: string, variant: 'work' | 'solution'): Promise<string | null> {
    const col = variant === 'solution' ? 'sim_solution_path' : 'sim_work_path';
    const result = await pool.query(`SELECT ${col} AS p FROM tasks WHERE id=$1`, [taskId]);
    const rel = result.rows[0]?.p;
    if (!rel) return null;
    const r = path.join(__dirname, '../public/', rel);
    console.log(r);
    return r;
}

/**
 * Extrahiert die Simulation nur, wenn sie noch nicht existiert.
 * Startet **keinen Cleanup-Timer**, der läuft erst beim Schließen.
 */
export async function extractSimulation(taskId: string, zipPath: string, variant: 'work' | 'solution'): Promise<string | null> {
    try {
        if (!fs.existsSync(zipPath)) {
            console.warn(`❌ ZIP file does not exist: ${zipPath}`);
            return null;
        }

        // Holt oder erstellt den Ordner
        const extractDir = await getOrCreateSimulationFolder(taskId, variant);

        // Prüfen, ob schon entpackt
        const indexFile = path.join(extractDir, 'index.html');
        if (!fs.existsSync(indexFile)) {
            await fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .promise();
            console.log('Simulation extracted to:', extractDir);
        } else {
            console.log('Simulation folder already exists, skipping extraction:', extractDir);
        }

        return extractDir;
    } catch (err) {
        console.error('❌ Failed to extract simulation:', err);
        return null;
    }
}

/**
 * Wird aufgerufen, wenn der Client die Simulation schließt.
 * Startet den Cleanup-Timer für den Ordner.
 */
export function handleSimulationClosed(taskId: string, variant: 'work' | 'solution') {
    const folderPath = path.join(__dirname, `../../tmp/simulations/${taskId}/${variant}`);
    scheduleCleanup(folderPath, `${taskId}_${variant}`);
}

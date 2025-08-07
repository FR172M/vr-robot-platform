import fs from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';
import {pool} from "../db";

const extractionCache: Record<string, NodeJS.Timeout> = {};

export async function getSimulationZipPath(taskId: string): Promise<string | null> {
    const result = await pool.query(
        'SELECT simulation_path FROM tasks WHERE id = $1',
        [taskId]
    );

    const simulationPath = result.rows[0]?.simulation_path;
    if (!simulationPath) {
        console.warn(`⚠️ No simulation_path found for task ${taskId}`);
        return null;
    }

    const fullPath = path.join(__dirname, '../public', simulationPath);
    console.log(`🧭 [getSimulationZipPath] Resolved path for task ${taskId}: ${fullPath}`);
    return fullPath;
}


export async function extractSimulation(taskId: string, zipPath: string): Promise<string> {
    const extractDir = path.join(__dirname, '../../tmp/simulations', taskId);

    console.log(`📦 [extractSimulation] Called for task: ${taskId}`);
    console.log(`📂 Extracting to: ${extractDir}`);
    console.log(`🗃️ ZIP path: ${zipPath}`);
    console.log(`🧪 Exists? ZIP: ${fs.existsSync(zipPath)}, ExtractDir: ${fs.existsSync(extractDir)}`);

    try {
        if (fs.existsSync(extractDir)) {
            console.log(`♻️ Already extracted → Resetting timeout for task ${taskId}`);
            if (extractionCache[taskId]) clearTimeout(extractionCache[taskId]);
        } else {
            await fs.ensureDir(extractDir);
            console.log(`📁 Created directory: ${extractDir}`);
            console.log(`📥 Starting unzip...`);
            await fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .promise();
            console.log(`✅ Unzip complete`);
        }

        extractionCache[taskId] = setTimeout(() => {
            fs.remove(extractDir);
            delete extractionCache[taskId];
            console.log(`🧹 Temporary simulation folder deleted for task ${taskId}`);
        }, 5 * 60 * 1000);

        return extractDir;
    } catch (error) {
        console.error(`❌ Failed to extract zip for task ${taskId}:`, error);
        throw error;
    }
}


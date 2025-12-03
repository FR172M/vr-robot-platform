import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import {v4 as uuid} from "uuid";
import {execSync} from "child_process";
import axios from "axios";

export const isDocker = fsSync.existsSync("/.dockerenv");
console.log("isDocker:", isDocker);

// Root-Pfade im Backend
export const TMP_BASE = isDocker
    ? path.resolve(process.cwd(), "/tmp/simulations")
    : path.resolve(__dirname, "../../tmp/simulations");

const SANDBOX_ROOT = TMP_BASE;
const WRAPPER_ROOT = path.join(process.cwd(), "src/public/assets/wrapper");
const API_ROOT = TMP_BASE;

console.log("TMP_BASE:", TMP_BASE);
console.log("SANDBOX_ROOT:", SANDBOX_ROOT);
console.log("WRAPPER_ROOT:", WRAPPER_ROOT);
console.log("API_ROOT:", API_ROOT);

export type SandboxMode = "api" | "code";

export interface RunConfig {
    taskId: string;
    userId: string;
    variant: "work" | "solution";
    mode: SandboxMode;
    userCode?: string;
}

// --- Hilfsfunktion: sicheres Kopieren ---
async function safeCopyFile(src: string, dest: string) {
    try {
        await fs.access(src);
    } catch {
        throw new Error(`Quell-Datei existiert nicht: ${src}`);
    }

    const destDir = path.dirname(dest);
    await fs.mkdir(destDir, {recursive: true});
    await fs.copyFile(src, dest);
}

// --- Sandbox ausführen ---
export async function runPythonSandbox(config: RunConfig) {
    console.log("=== runPythonSandbox START ===");
    const runId = uuid();
    const sandboxPath = path.join(SANDBOX_ROOT, runId);
    console.log("Creating sandbox path:", sandboxPath);
    await fs.mkdir(sandboxPath, {recursive: true});

    // Wrapper-Datei
    const wrapperFileName = config.mode === "api" ? "listApiWrapper.py" : "userCodeWrapper.py";
    const srcWrapper = path.join(WRAPPER_ROOT, wrapperFileName);
    const destWrapper = path.join(sandboxPath, wrapperFileName);
    console.log("Copying wrapper file:", srcWrapper, "->", destWrapper);
    await safeCopyFile(srcWrapper, destWrapper);

    // userCode optional
    if (config.mode === "code" && config.userCode) {
        const userCodePath = path.join(sandboxPath, "userCode.py");
        console.log("Writing userCode.py to:", userCodePath);
        await fs.writeFile(userCodePath, config.userCode, "utf-8");
    }

    // robot_api.py kopieren
    const apiFileName = "robot_api.py";
    const apiSrc = path.join(API_ROOT, config.taskId, config.variant, apiFileName);
    const apiDest = path.join(sandboxPath, apiFileName);
    console.log("Copying robot_api.py:", apiSrc, "->", apiDest);
    await safeCopyFile(apiSrc, apiDest);

    if (!fsSync.existsSync(destWrapper)) {
        throw new Error("Wrapper-Datei existiert nicht: " + destWrapper);
    }

    let output: any;
    if (!isDocker) {
        console.log("Running locally...");
        try {
            const result = execSync(`python3 ${wrapperFileName}`, {cwd: sandboxPath}).toString();
            console.log("Local output:", result);
            output = JSON.parse(result);
        } catch (err: any) {
            console.error("Local execution error:", err);
            output = {error: err.message, raw: err.stdout?.toString() || ""};
        }
    } else {
        console.log("Running via Sandbox API...");
        output = await runViaSandboxAPI({sandboxPath, wrapperFileName, runId, config, apiFileName});
    }

    console.log("=== runPythonSandbox END ===");
    return {runId, output};
}

// --- Kommunikation mit permanent laufender Sandbox-API ---
export interface SandboxRunParams {
    sandboxPath: string;
    wrapperFileName: string;
    runId: string;
    config: any;
    apiFileName: string;
}

export async function runViaSandboxAPI({
                                           sandboxPath,
                                           wrapperFileName,
                                           runId,
                                           config,
                                           apiFileName
                                       }: SandboxRunParams): Promise<any> {


    const wrapperFilePath = path.join(sandboxPath, wrapperFileName);
    const apiFilePath = path.join(sandboxPath, apiFileName);

    const payload = {
        runId,
        wrapperFileName,
        wrapperFileContent: await fs.readFile(wrapperFilePath, "utf-8"),
        apiFileName,
        apiFileContent: await fs.readFile(apiFilePath, "utf-8"),
        userCodeContent: config.userCode || ""
    };

    const resp = await axios.post("http://sandbox:5000/run", payload);

    // --- WICHTIG: Output parsen ---
    let parsedOutput = {};
    try {
        parsedOutput = JSON.parse(resp.data.output);
    } catch {
        parsedOutput = resp.data.output; // fallback
    }

    return {
        ...resp.data,
        output: parsedOutput
    };
}


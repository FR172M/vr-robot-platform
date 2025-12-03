import {Request, Response, NextFunction} from "express";
import {runPythonSandbox} from "../utils/dockerRunner";

export async function runCode(req: Request, res: Response, next: NextFunction) {
    try {
        const {taskId, variant, code} = req.body;

        if (!code) return res.status(400).json({error: "No code provided"});
        if (!taskId) return res.status(400).json({error: "No taskId provided"});
        if (!req.user?.id) return res.status(401).json({error: "User not authenticated"});

        const result = await runPythonSandbox({
            taskId,
            userId: req.user.id,
            mode: "code",
            variant: variant,
            userCode:code,
        });

        res.json(result);
    } catch (err: any) {
        console.error("runCode error:", err);
        if (err.stack) console.error(err.stack);
        res.status(500).json({error: err.toString(), stack: err.stack});
    }
}

export async function listApi(req: Request, res: Response, next: NextFunction) {
    try {
        const {taskId, variant} = req.params;

        if (!taskId) return res.status(400).json({error: "No taskId provided"});
        if (!variant) return res.status(400).json({error: "No variant provided"});
        if (variant !== "work" && variant !== "solution") return res.status(400).json({error: "Wrong variant provided"});
        if (!req.user?.id) return res.status(401).json({error: "User not authenticated"});

        const apiInfo = await runPythonSandbox({
            taskId,
            userId: req.user.id,
            variant: variant,
            mode: "api",
        });

        res.json({apiInfo});
    } catch (err: any) {
        console.error("listApi error:", err);
        if (err.stack) console.error(err.stack);
        res.status(500).json({error: err.toString(), stack: err.stack});
    }
}

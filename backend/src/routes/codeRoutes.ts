import express from "express";
import { listApi, runCode } from "../controllers/codeController";

const router = express.Router();

router.get("/list-api/:taskId/:variant", listApi);      // Funktion wird übergeben
router.post("/run-python", runCode);                    // Funktion wird übergeben

export default router;

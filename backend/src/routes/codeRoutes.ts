import { Router } from "express";
import {listApi, runCode} from "../controllers/codeController";

const router = Router();

router.post("/run-python", runCode);
router.get("/list-api/:taskId/:variant", listApi);


export default router;

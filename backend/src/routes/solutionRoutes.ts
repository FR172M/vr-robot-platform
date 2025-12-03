// backend/src/routes/solutionRoutes.ts
import { Router } from 'express';
import {
    createOrStartSolution,
    updateSolution,
    getMySolutionForTask,
    getAllSolutionsForTask, updateGrade,
} from '../controllers/solutionController';
import {authenticateJWT, authorizeRoles} from '../auth/auth';

const router = Router();

// User startet eine Aufgabe zum ersten Mal oder erzeugt Solution-Eintrag
router.post('/', createOrStartSolution);

// User updated oder submitted seine Lösung
router.put('/:solutionId', updateSolution);

// Für User selbst – eigene Lösung für bestimmte Task abrufen
router.get('/me/:taskId', getMySolutionForTask);

// Für Teacher – alle Solutions zu einer Task abrufen
router.get('/task/:taskId', authorizeRoles('teacher'), getAllSolutionsForTask);

// Für Teacher – grade und Feedback setzen
router.put('/task/grade/:solutionId', authorizeRoles('teacher'), updateGrade);


export default router;

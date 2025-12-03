import {Router} from 'express';
import {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
} from '../controllers/userController';
import {authorizeRoles} from "../auth/auth";

const router = Router();

// Admin/Teacher kann alle User sehen
router.get('/', authorizeRoles('teacher'), getAllUsers);

// User Details abrufen
router.get('/:id', getUserById);

// User Rolle ändern (nur Lehrer/Admin)
router.put('/:id/role', authorizeRoles('teacher'), updateUserRole);

// User löschen (nur Lehrer/Admin)
router.delete('/:id', authorizeRoles('teacher'), deleteUser);

export default router;

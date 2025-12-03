// backend/src/routes/loginRoutes.ts
import express from 'express';
import { authenticateToken, AuthRequest, loginUser } from '../controllers/loginController';

const router = express.Router();

// POST /api/login → setzt HttpOnly-Cookie
router.post('/login', loginUser);


// GET /api/me → liest Userinfos aus dem Cookie
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
    res.json({
        role: req.user?.role,
        email: req.user?.email,
        username: req.user?.username
    });
});

// POST /api/logout → löscht das Cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    res.json({ message: "Logged out successfully" });
});

export default router;

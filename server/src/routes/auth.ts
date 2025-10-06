import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegistration, validateLogin, validateRefreshToken } from '../middleware/validation.js';

const router = Router();

// Routes d'authentification publiques
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh', validateRefreshToken, AuthController.refresh);
router.post('/logout', AuthController.logout);

// Routes d'authentification protégées
router.get('/me', authenticateToken, AuthController.me);

export default router;
import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { verifyToken } from '../middlewares/auth';

const router = express.Router();

// Register new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Get user profile
router.get('/profile', verifyToken, AuthController.getProfile);

export default router; 
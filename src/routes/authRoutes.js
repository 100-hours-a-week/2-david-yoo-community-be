import express from 'express';
import {
    signup,
    login,
    logout,
    withdrawUser,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/withdraw', withdrawUser);
router.post('/login', login);
router.post('/logout', logout);

export default router;
import express from 'express';
import {
    signup,
    login,
    logout,
    updateNickname,
    isAuthenticated,
    withdrawUser,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/withdraw', withdrawUser);
router.post('/login', login);
router.post('/logout', logout);
router.post('/update-nickname', isAuthenticated, updateNickname);

export default router;

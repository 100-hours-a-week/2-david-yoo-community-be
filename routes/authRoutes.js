import express from 'express';
import {
    signup,
    login,
    updateNickname,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/update-nickname', updateNickname);

export default router;

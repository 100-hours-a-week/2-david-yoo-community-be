import express from 'express';
import {
    updateNickname,
    changePassword,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/update-nickname', updateNickname);
router.post('/change-password', changePassword);

export default router;

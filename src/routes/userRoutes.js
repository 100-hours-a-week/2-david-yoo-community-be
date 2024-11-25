import express from 'express';
import {
    updateNickname,
    changePassword,
    updateProfileImage,
    getProfileImage,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/update-nickname', updateNickname);
router.post('/change-password', changePassword);
router.post('/update-profile-image', updateProfileImage);
router.get('/profile-image/:email', getProfileImage);

export default router;

import express from 'express';
import { updateLikes, checkLikeStatus } from '../controllers/likeController.js';

const router = express.Router();

router.post('/likes/:postId', updateLikes);
router.get('/likes/check/:postId', checkLikeStatus);

export default router;

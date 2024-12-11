import express from 'express';
import { updateLikes, checkLikeStatus } from '../controllers/likeController.js';

const router = express.Router();

router.post('/:postId', updateLikes);
router.get('/check/:postId', checkLikeStatus);

export default router;
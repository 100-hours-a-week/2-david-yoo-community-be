import express from 'express';
import { toggleLike, checkLikeStatus } from '../controllers/likeController.js';

const router = express.Router();

router.post('/likes/:postId', toggleLike);
router.get('/likes/check/:postId', checkLikeStatus);

export default router;

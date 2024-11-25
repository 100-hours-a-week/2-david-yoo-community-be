// likesRoutes.js

import express from 'express';
import { updateLikes, checkLikeStatus } from '../controllers/likeController.js';

const router = express.Router();

// 좋아요 업데이트
router.post('/likes/:postId', updateLikes);

// 좋아요 상태 확인
router.get('/likes/check/:postId', checkLikeStatus);

export default router;

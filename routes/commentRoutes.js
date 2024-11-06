import express from 'express';
import {
    addComment,
    getComments,
    deleteComment,
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/comments', addComment);
router.get('/comments/:postId', getComments);
router.delete('/comments/:id', deleteComment);

export default router;

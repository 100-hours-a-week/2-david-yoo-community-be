import express from 'express';
import {
    addComment,
    getComments,
    deleteComment,
    updateComment,
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/comments', addComment);
router.get('/comments/:postId', getComments);
router.delete('/comments/:id', deleteComment);
router.put('/comments/:id', updateComment);

export default router;

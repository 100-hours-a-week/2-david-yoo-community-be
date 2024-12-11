import express from 'express';
import {
    addComment,
    getComments,
    deleteComment,
    updateComment,
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/', addComment);
router.get('/:postId', getComments);
router.delete('/:id', deleteComment);
router.put('/:id', updateComment);

export default router;
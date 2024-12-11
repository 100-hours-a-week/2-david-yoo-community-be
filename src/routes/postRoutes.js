import express from 'express';
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
} from '../controllers/postController.js';

const router = express.Router();

router.post('/create-post', createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
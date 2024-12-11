import express from 'express';
import { incrementViews } from '../controllers/viewController.js';

const router = express.Router();

router.post('/:id', incrementViews);

export default router;
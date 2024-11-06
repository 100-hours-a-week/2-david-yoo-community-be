import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(cors({ origin: 'http://127.0.0.1:5500', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터를 처리

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html')),
);

// 라우트 연결
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/user', userRoutes);
app.use('/api', commentRoutes);

app.listen(PORT, () =>
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`),
);

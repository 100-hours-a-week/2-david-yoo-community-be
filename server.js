import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import viewRoutes from './routes/viewRoutes.js';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(
    cors({
        origin: 'http://127.0.0.1:5500', // 모든 출처 허용
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html')),
);

// 세션
app.use(
    session({
        secret: 'my-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000, // 24시간 후 세션 종료
            sameSite: 'none',
        },
    }),
);

// 라우트 연결
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/user', userRoutes);
app.use('/api', commentRoutes);
app.use('/api', likeRoutes);
app.use('/api/views', viewRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 이미지 요청을 처리하는 라우트
app.get('/posts/image/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, 'uploads', req.params.imageName); // 이미지 경로 설정

    // 이미지 파일을 읽고 Base64로 변환
    fs.readFile(imagePath, (err, data) => {
        if (err) {
            return res.status(500).send('이미지를 읽을 수 없습니다.');
        }

        // 이미지를 Base64로 인코딩
        const base64Image = Buffer.from(data).toString('base64');

        // CORS 설정
        res.setHeader('Access-Control-Allow-Origin', '*'); // 모든 출처에서 접근 가능하도록 설정
        res.setHeader('Content-Type', 'application/json'); // 응답 타입을 JSON으로 설정

        // Base64로 인코딩된 이미지를 JSON 형식으로 응답
        res.json({ image: base64Image });
    });
});

app.listen(PORT, () =>
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`),
);

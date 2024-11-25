import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';
import session from 'express-session';
import dotenv from 'dotenv';

// 라우트 모듈
import authRoutes from './src/routes/authRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import likeRoutes from './src/routes/likeRoutes.js';
import viewRoutes from './src/routes/viewRoutes.js';

// 데이터베이스 설정
import './src/config/database.js';

// Express 앱 초기화 및 환경 설정
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// 업로드 디렉토리 구조 설정
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const postsDir = path.join(uploadsDir, 'posts');

// 필요한 디렉토리 생성
[uploadsDir, profilesDir, postsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 프로필 이미지와 게시글 이미지를 다른 경로에 저장
        const isProfile = req.path.includes('profile');
        const uploadPath = isProfile ? profilesDir : postsDir;
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 파일명 중복 방지를 위한 유니크 이름 생성
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// CORS 설정
app.use(
    cors({
        origin: 'http://127.0.0.1:5500',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'X-User-Email',
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Origin',
            'Authorization',
        ],
    }),
);

// 요청 본문 파싱 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 세션 설정
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'my-secret-key', // 환경변수로 변경 권장
        resave: true,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure 활성화
            maxAge: 24 * 60 * 60 * 1000, // 24시간
            sameSite: 'lax',
        },
    }),
);

// 정적 파일 제공 설정
// CORS 헤더가 포함된 uploads 디렉토리 접근 설정
app.use(
    '/uploads',
    (req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        );
        next();
    },
    express.static(path.join(process.cwd(), 'uploads')),
);

// 라우트 설정
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/user', userRoutes);
app.use('/api', commentRoutes);
app.use('/api', likeRoutes);
app.use('/api/views', viewRoutes);

// 서버 시작
app.listen(PORT, () =>
    console.log(`✅ Server running at http://localhost:${PORT}`),
);

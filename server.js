import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 업로드할 디렉토리
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // 원본 파일 이름 사용
    },
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: 'http://127.0.0.1:5500', // CORS 허용할 출처
    credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'html', 'login.html'));
});


// 회원가입 API
app.post('/signup', async (req, res) => {
    const { email, password, nickname } = req.body;
    const userData = { email, password, nickname };

    // 비밀번호 해싱
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        userData.password = hashedPassword; // 해싱된 비밀번호로 교체
    } catch (error) {
        return res.status(500).send('비밀번호 해싱 오류');
    }

    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');
        let users = data ? JSON.parse(data) : [];
        users.push(userData);

        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('파일 저장 오류');
            res.status(201).send({ message: '회원가입 성공' });
        });
    });
});


// 로그인 API
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // 사용자 정보 읽기
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).send('데이터 파싱 오류');
        }

        // 이메일로 사용자 검색
        const user = users.find((user) => user.email === email);
        if (!user) return res.status(401).send('이메일 또는 비밀번호가 올바르지 않습니다.');

        // 비밀번호 확인
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send('비밀번호 확인 오류');
            if (!result) return res.status(401).send('이메일 또는 비밀번호가 올바르지 않습니다.');

            res.status(200).json({ success: true, nickname: user.nickname });
        });
    });
});


// 닉네임 업데이트 라우트
app.post('/update-nickname', (req, res) => {
    const { email, nickname } = req.body;
    
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('파일 읽기 오류:', err);
            return res.status(500).json({ success: false, message: '서버 오류 발생' });
        }

        let users = JSON.parse(data);
        const user = users.find(user => user.email === email);

        if (user) {
            user.nickname = nickname;
            fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8', (err) => {
                if (err) {
                    console.error('파일 쓰기 오류:', err);
                    return res.status(500).json({ success: false, message: '서버 오류 발생' });
                }
                res.json({ success: true });
            });
        } else {
            res.status(404).json({ success: false, message: '사용자를 찾을 수 없음' });
        }
    });
});

// 게시물 생성 엔드포인트
app.post('/create-post', upload.single('image'), (req, res) => {
    const { title, content, nickname } = req.body;
    const time = new Date().toISOString();
    
    // 새로운 게시물 객체 생성 
    // TODO : image
    const newPost = { title, content, nickname, time };

    // 기존 게시물 데이터 읽기
    fs.readFile('data/post-data.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('서버 오류');

        const posts = JSON.parse(data || '[]'); // 빈 배열로 초기화

        // ID 자동 할당: 기존 게시물에서 최대 ID 값을 찾아서 1 증가
        const maxId = posts.length > 0 ? Math.max(...posts.map(post => post.id)) : 0;
        newPost.id = maxId + 1; // 새로운 ID 할당

        posts.push(newPost); // 새로운 게시물 추가

        // 파일에 저장
        fs.writeFile('data/post-data.json', JSON.stringify(posts, null, 2), (err) => {
            if (err) return res.status(500).send('서버 오류');
            res.json({ success: true });
        });
    });
});

// 비밀번호 변경
app.post('/change-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // 사용자 정보 읽기
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).send('데이터 파싱 오류');
        }

        // 이메일로 사용자 검색
        const userIndex = users.findIndex((user) => user.email === email);
        if (userIndex === -1) return res.status(404).send('사용자를 찾을 수 없습니다.');

        // 새 비밀번호 해싱
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('비밀번호 해싱 오류');

            // 비밀번호 업데이트
            users[userIndex].password = hashedPassword;

            // 업데이트된 데이터 저장
            fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
                if (err) return res.status(500).send('파일 저장 오류');
                res.status(200).send({ message: '비밀번호 변경 성공' });
            });
        });
    });
});

app.get('/posts', (req, res) => {
    const filePath = path.join(process.cwd(), 'data', 'post-data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');

        let posts;
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).send('데이터 파싱 오류');
        }

        res.json(posts); // 게시글 데이터 반환
    });
});

// 게시판
app.get('/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);

    fs.readFile('data/post-data.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('서버 오류');

        const posts = JSON.parse(data || '[]');
        const post = posts.find(p => p.id === postId); // ID로 게시물 찾기

        if (post) {
            res.json(post);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    });
});

// 게시물 수정
app.put('/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const updatedPost = req.body;

    // 기존 게시물 데이터 읽기
    fs.readFile('data/post-data.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('서버 오류');

        let posts = JSON.parse(data || '[]'); // 빈 배열로 초기화
        const postIndex = posts.findIndex(post => post.id === postId);

        if (postIndex !== -1) {
            posts[postIndex] = { ...posts[postIndex], ...updatedPost }; // 기존 게시물 수정
            fs.writeFile('data/post-data.json', JSON.stringify(posts, null, 2), (err) => {
                if (err) return res.status(500).send('서버 오류');
                res.json({ success: true });
            });
        } else {
            res.status(404).send('게시물을 찾을 수 없습니다.');
        }
    });
});


app.listen(PORT, () => console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`));
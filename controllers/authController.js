import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// 회원가입 로직
export const signup = async (req, res) => {
    const { email, password, nickname } = req.body;
    const userData = { email, password, nickname };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        userData.password = hashedPassword;

        const filePath = path.join(process.cwd(), 'data', 'userInfo.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return res.status(500).send('파일 읽기 오류');
            let users = data ? JSON.parse(data) : [];
            users.push(userData);

            fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
                if (err) return res.status(500).send('파일 저장 오류');
                res.status(201).send({ message: '회원가입 성공' });
            });
        });
    } catch (error) {
        res.status(500).send('서버 오류');
    }
};

// 유저 인증을 확인하는 미들웨어
export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(400).json({ success: false, message: '인증이 필요합니다.' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const users = JSON.parse(data || '[]');
        const user = users.find(user => user.email === email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }

        // 유저 세션
        req.session.user = {
            email: user.email,
            nickname: user.nickname,
        };

        res.status(200).json({
            success: true,
            nickname: user.nickname,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 로그아웃
export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '로그아웃 처리 중 오류가 발생했습니다.',
            });
        }
        res.clearCookie('connect.sid'); // 세션 쿠키 클리어
        res.status(200).json({
            success: true,
            message: '로그아웃 되었습니다.',
        });
    });
};

// 닉네임 변경
export const updateNickname = (req, res) => {
    const { email, nickname } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');

        let users = JSON.parse(data);
        const user = users.find(user => user.email === email);

        if (user) {
            user.nickname = nickname;
            fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
                if (err)
                    return res
                        .status(500)
                        .json({ success: false, message: '파일 저장 오류' });
                res.json({ success: true });
            });
        } else {
            res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없음',
            });
        }
    });
};

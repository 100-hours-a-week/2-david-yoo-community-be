import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { saveBase64Image } from '../utils/fileUtils.js';

// 회원가입 로직
export const signup = async (req, res) => {
    const { email, password, nickname, profileImage } = req.body;
    let profileImageName = 'default.webp'; // 기본 이미지 이름으로 초기화

    try {
        const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

        // 프로필 이미지 처리
        if (profileImage && profileImage !== 'default.webp') {
            profileImageName = await saveBase64Image(profileImage, email);
        }

        // 파일 읽기
        const data = await fs.promises.readFile(filePath, 'utf8');
        const users = data ? JSON.parse(data) : [];

        // 이메일 중복 체크
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.',
            });
        }

        // 비밀번호 해시화 및 사용자 추가
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            email,
            password: hashedPassword,
            nickname,
            profileImage: profileImageName,
        };
        users.push(userData);

        // 파일 저장
        await fs.promises.writeFile(filePath, JSON.stringify(users, null, 2));
        res.status(201).json({
            success: true,
            message: '회원가입 성공',
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

export const withdrawUser = async (req, res) => {
    const { email } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        let users = JSON.parse(data || '[]');
        // 해당 이메일을 가진 사용자 찾기
        const userIndex = users.findIndex(user => user.email === email);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }
        // 사용자 제거
        users.splice(userIndex, 1);
        await fs.promises.writeFile(filePath, JSON.stringify(users, null, 2));
        // 세션 삭제
        if (req.session) {
            req.session.destroy();
        }
        res.status(200).json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.',
        });
    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 유저 인증을 확인하는 미들웨어
export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(400).json({ success: false, message: '인증이 필요합니다.' });
    }

    try {
        const userEmail = authHeader.split(' ')[1];
        req.user = { email: userEmail };
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: '인증이 유효하지 않습니다.',
        });
    }
};

// 로그인
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
        req.session.user = {
            email: user.email,
            nickname: user.nickname,
        };

        res.status(200).json({
            success: true,
            nickname: user.nickname,
            user: req.session.user,
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

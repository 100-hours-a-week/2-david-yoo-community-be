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

// 로그인 로직
export const login = (req, res) => {
    const { email, password } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');
        let users = JSON.parse(data || '[]');
        const user = users.find(user => user.email === email);

        if (!user)
            return res
                .status(401)
                .send('이메일 또는 비밀번호가 올바르지 않습니다.');

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send('비밀번호 확인 오류');
            if (!result)
                return res
                    .status(401)
                    .send('이메일 또는 비밀번호가 올바르지 않습니다.');
            res.status(200).json({ success: true, nickname: user.nickname });
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

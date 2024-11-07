import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// 닉네임 업데이트 로직
export const updateNickname = (req, res) => {
    const { email, nickname } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err)
            return res
                .status(500)
                .json({ success: false, message: '서버 오류 발생' });
        let users = JSON.parse(data || '[]');
        const user = users.find(user => user.email === email);

        if (user) {
            user.nickname = nickname;
            fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
                if (err)
                    return res
                        .status(500)
                        .json({ success: false, message: '서버 오류 발생' });
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

// 비밀번호 변경 로직
export const changePassword = async (req, res) => {
    const { email, newPassword } = req.body;
    const filePath = path.join(process.cwd(), 'data', 'userInfo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');
        let users = JSON.parse(data || '[]');
        const userIndex = users.findIndex(user => user.email === email);

        if (userIndex === -1)
            return res.status(404).send('사용자를 찾을 수 없습니다.');

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('비밀번호 해싱 오류');
            users[userIndex].password = hashedPassword;

            fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
                if (err) return res.status(500).send('파일 저장 오류');
                res.status(200).send({ success: true, message: '비밀번호 변경 성공' });
            });
        });
    });
};

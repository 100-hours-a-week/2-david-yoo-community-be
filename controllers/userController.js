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

const uploadDirectory = () => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

export const updateProfileImage = async (req, res) => {
    const { email, profileImage } = req.body;

    try {
        const filePath = path.join(process.cwd(), 'data', 'userInfo.json');
        const data = await fs.promises.readFile(filePath, 'utf8');
        let users = JSON.parse(data || '[]');

        const userIndex = users.findIndex(user => user.email === email);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }

        const uploadDir = uploadDirectory();
        let profileImageName = users[userIndex].profileImage;

        // 새로운 이미지가 업로드된 경우
        if (profileImage && profileImage.startsWith('data:image')) {
            // 이전 이미지 삭제 (기본 이미지가 아닌 경우)
            if (profileImageName !== 'default.webp') {
                const oldImagePath = path.join(uploadDir, profileImageName);
                if (fs.existsSync(oldImagePath)) {
                    await fs.promises.unlink(oldImagePath);
                }
            }
            const base64Data = profileImage.replace(
                /^data:image\/\w+;base64,/,
                '',
            );
            const imageBuffer = Buffer.from(base64Data, 'base64');
            profileImageName = `${email}-${Date.now()}.png`;
            const imagePath = path.join(uploadDir, profileImageName);

            await fs.promises.writeFile(imagePath, imageBuffer);
            users[userIndex].profileImage = profileImageName;
            await fs.promises.writeFile(
                filePath,
                JSON.stringify(users, null, 2),
            );
        }

        res.status(200).json({
            success: true,
            profileImage: profileImageName,
            message: '프로필 이미지가 업데이트되었습니다.',
        });
    } catch (error) {
        console.error('프로필 이미지 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 프로필 이미지 조회 API
export const getProfileImage = async (req, res) => {
    const { email } = req.params;

    try {
        const filePath = path.join(process.cwd(), 'data', 'userInfo.json');
        const data = await fs.promises.readFile(filePath, 'utf8');
        const users = JSON.parse(data || '[]');

        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }

        res.json({
            success: true,
            profileImage: user.profileImage,
        });
    } catch (error) {
        console.error('프로필 이미지 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
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
                res.status(200).send({
                    success: true,
                    message: '비밀번호 변경 성공',
                });
            });
        });
    });
};

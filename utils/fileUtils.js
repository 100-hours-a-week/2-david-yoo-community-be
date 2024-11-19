import fs from 'fs';
import multer from 'multer';
import path from 'path';

// 업로드 디렉토리 생성 및 확인 유틸리티
export const ensureUploadDirectory = (dirName = 'uploads') => {
    const uploadDir = path.join(process.cwd(), dirName);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

// Multer 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = ensureUploadDirectory();
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// 파일 필터 설정
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 기본 Multer 업로드 설정
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
    },
});

// 파일 삭제 유틸리티
export const deleteFile = async filename => {
    if (!filename || filename === 'default.webp') return;

    const filePath = path.join(process.cwd(), 'uploads', filename);
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw error;
    }
};

// Base64 이미지 저장 유틸리티
export const saveBase64Image = async (base64Data, email) => {
    if (!base64Data || !base64Data.startsWith('data:image')) {
        throw new Error('유효하지 않은 이미지 데이터입니다.');
    }

    const uploadDir = ensureUploadDirectory();
    const imageData = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    const filename = `${email}-${Date.now()}.png`;
    const imagePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(imagePath, imageBuffer);
    return filename;
};

// 이미지를 Base64로 변환하는 유틸리티
export const getImageAsBase64 = async filename => {
    if (!filename) return null;

    try {
        const imagePath = path.join(process.cwd(), 'uploads', filename);
        const imageData = await fs.promises.readFile(imagePath);
        return `data:image/jpeg;base64,${imageData.toString('base64')}`;
    } catch (error) {
        console.error('이미지 로드 실패:', error);
        return null;
    }
};

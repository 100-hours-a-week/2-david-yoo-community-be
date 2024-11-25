/*
 * 파일 관리 유틸리티
 * 파일 업로드, 삭제, 이미지 변환 등 파일 처리 관련 기능을 제공
 * Multer를 활용한 파일 업로드와 Base64 이미지 처리 구현
 */

import fs from 'fs';
import multer from 'multer';
import path from 'path';

// 업로드 디렉토리 생성 및 확인
// @param {string} dirName - 생성할 디렉토리 이름 (기본값: 'uploads')
// @returns {string} 생성된 업로드 디렉토리 경로
export const ensureUploadDirectory = (dirName = 'uploads') => {
    const uploadDir = path.join(process.cwd(), dirName);
    // 메인 업로드 디렉토리 생성
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // profiles와 posts 서브디렉토리 생성
    const profilesDir = path.join(uploadDir, 'profiles');
    const postsDir = path.join(uploadDir, 'posts');

    if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
    }
    if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
    }

    return uploadDir;
};

// Multer 스토리지 설정 (게시글 이미지용)
const postStorage = multer.diskStorage({
    // 파일 저장 위치 설정
    destination: (req, file, cb) => {
        const uploadDir = path.join(ensureUploadDirectory(), 'posts');
        cb(null, uploadDir);
    },
    // 파일 이름 설정 (중복 방지를 위한 타임스탬프 사용)
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// 파일 형식 필터링
// @param {Object} req - 요청 객체
// @param {Object} file - 업로드된 파일 정보
// @param {Function} cb - 콜백 함수
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// Multer 업로드 설정
export const upload = multer({
    storage: postStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
    },
});

// 파일 삭제
// @param {string} filename - 삭제할 파일 이름
// @param {boolean} isProfile - 프로필 이미지 여부
// @throws {Error} 파일 삭제 실패 시 에러
export const deleteFile = async (filename, isProfile = false) => {
    if (!filename || filename === 'default.webp') return;

    const subDir = isProfile ? 'profiles' : 'posts';
    const filePath = path.join(process.cwd(), 'uploads', subDir, filename);

    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw error;
    }
};

// Base64 이미지 저장
// @param {string} base64Data - Base64 형식의 이미지 데이터
// @param {string} email - 사용자 이메일 (파일명 생성에 사용)
// @param {boolean} isProfile - 프로필 이미지 여부
// @returns {string} 저장된 파일명
// @throws {Error} 유효하지 않은 이미지 데이터인 경우
export const saveBase64Image = async (base64Data, email, isProfile = false) => {
    // 데이터 유효성 검사
    if (!base64Data || !base64Data.startsWith('data:image')) {
        throw new Error('유효하지 않은 이미지 데이터입니다.');
    }

    const uploadDir = ensureUploadDirectory();
    const subDir = isProfile ? 'profiles' : 'posts';
    // Base64 데이터에서 실제 이미지 데이터 추출
    const imageData = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    // 고유한 파일명 생성
    const filename = `${email}-${Date.now()}.png`;
    const imagePath = path.join(uploadDir, subDir, filename);

    await fs.promises.writeFile(imagePath, imageBuffer);
    return filename;
};

// 이미지를 Base64로 변환
// @param {string} filename - 변환할 이미지 파일명
// @param {boolean} isProfile - 프로필 이미지 여부
// @returns {string|null} Base64 형식의 이미지 데이터 또는 null
export const getImageAsBase64 = async (filename, isProfile = false) => {
    if (!filename) return null;

    try {
        const subDir = isProfile ? 'profiles' : 'posts';
        const imagePath = path.join(process.cwd(), 'uploads', subDir, filename);
        const imageData = await fs.promises.readFile(imagePath);
        return `data:image/jpeg;base64,${imageData.toString('base64')}`;
    } catch (error) {
        console.error('이미지 로드 실패:', error);
        return null;
    }
};

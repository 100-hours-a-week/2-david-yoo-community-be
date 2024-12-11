import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { s3, BUCKET_NAME, CLOUDFRONT_DOMAIN } from '../config/s3config.js';

// AWS 설정 로그
console.log('AWS Config:', {
    bucketName: BUCKET_NAME,
    hasS3: !!s3,
    cloudfront: CLOUDFRONT_DOMAIN
});

// multerS3 설정
const s3Storage = multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
        
        // S3에는 전체 경로로 저장하지만
        const subDir = req.uploadType === 'profile' ? 'profiles' : 'posts';
        const s3Key = `uploads/${subDir}/${filename}`;
        
        // req에 순수 파일명만 저장하여 DB에는 파일명만 저장되도록 함
        req.savedFileName = filename;
        
        cb(null, s3Key);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

export const upload = multer({
    storage: s3Storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
    }
});

export const deleteFile = async (filename, isProfile = false) => {
    if (!filename || filename === 'default.webp') return;
    const subDir = isProfile ? 'profiles' : 'posts';
    const key = `uploads/${subDir}/${filename}`;
    try {
        await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: key
        }).promise();
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw error;
    }
};

export const saveBase64Image = async (base64Data, email, isProfile = false) => {
    if (!base64Data || !base64Data.startsWith('data:image')) {
        throw new Error('유효하지 않은 이미지 데이터입니다.');
    }
    const subDir = isProfile ? 'profiles' : 'posts';
    const imageData = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(imageData, 'base64');
    
    const filename = `${email}-${Date.now()}.png`;
    const key = `uploads/${subDir}/${filename}`;
    try {
        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/png',
            ACL: 'public-read'
        }).promise();
        return filename;
    } catch (error) {
        console.error('이미지 업로드 실패:', error);
        throw error;
    }
};

export const getImageUrl = (filename, isProfile = false) => {
    if (!filename) return null;

    // default.webp 처리
    if (filename === 'default.webp') {
        return `https://${CLOUDFRONT_DOMAIN}/uploads/profiles/default.webp`;
    }

    // 게시글 이미지 (posts/로 시작하는 경우)
    if (filename.startsWith('posts/')) {
        return `https://${CLOUDFRONT_DOMAIN}/uploads/posts/${filename}`;
    }

    // 프로필 이미지
    if (isProfile) {
        return `https://${CLOUDFRONT_DOMAIN}/uploads/profiles/${filename}`;
    }

    // 그 외의 경우 (새로운 게시글 이미지)
    return `https://${CLOUDFRONT_DOMAIN}/uploads/posts/${filename}`;
};
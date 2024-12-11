import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

// AWS SDK 설정
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

export { s3 };
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// 설정 확인 로깅
console.log('AWS Config:', {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    cloudfront: process.env.CLOUDFRONT_DOMAIN,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY,
    hasSecretKey: !!process.env.AWS_SECRET_KEY
});

// S3 연결 테스트
s3.headBucket({ Bucket: BUCKET_NAME }, (err) => {
    if (err) {
        console.error('S3 connection failed:', err);
    } else {
        console.log('Successfully connected to S3 bucket:', BUCKET_NAME);
    }
});
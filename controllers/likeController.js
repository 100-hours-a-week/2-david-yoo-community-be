import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_PATH = path.join(__dirname, '../data/post-data.json');
const LIKES_PATH = path.join(__dirname, '../data/likes-data.json');

// likes-data.json 파일이 없으면 생성하는 함수
async function ensureLikesFile() {
    try {
        await fs.access(LIKES_PATH);
    } catch {
        await fs.writeFile(LIKES_PATH, JSON.stringify([]));
    }
}

// // 유저 ID -> email 가져오기 함수
// function getUserIdentifier(req) {
//     if (!req.session.user) {
//         throw new Error('인증되지 않은 사용자입니다.');
//     }
//     // 이메일을 유저 식별자로 사용
//     return req.session.user.email;
// }

// 좋아요 토글 컨트롤러
export const toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;
        // const userId = getUserIdentifier(req);
        // 일단 유저아이디 그냥 다 random으로 만듬
        const userId = Math.random().toString(36).substring(7);

        await ensureLikesFile();

        // 좋아요 데이터 읽기
        const likesData = JSON.parse(await fs.readFile(LIKES_PATH, 'utf-8'));
        const postsData = JSON.parse(await fs.readFile(POSTS_PATH, 'utf-8'));

        // 해당 포스트와 유저의 좋아요 찾기
        const likeIndex = likesData.findIndex(
            like => like.postId === parseInt(postId) && like.userId === userId,
        );

        let isLiked;
        if (likeIndex > -1) {
            // 좋아요가 있으면 제거
            likesData.splice(likeIndex, 1);
            isLiked = false;
        } else {
            // 좋아요가 없으면 추가
            likesData.push({
                id: Date.now(),
                postId: parseInt(postId),
                userId,
                createdAt: new Date().toISOString(),
            });
            isLiked = true;
        }

        // 변경된 좋아요 데이터 저장
        await fs.writeFile(LIKES_PATH, JSON.stringify(likesData, null, 2));

        // 해당 포스트의 전체 좋아요 수 계산
        const likeCount = likesData.filter(
            like => like.postId === parseInt(postId),
        ).length;

        // 포스트 데이터에 좋아요 수 업데이트
        const postIndex = postsData.findIndex(
            post => post.id === parseInt(postId),
        );
        if (postIndex > -1) {
            postsData[postIndex].likeCount = likeCount;
            await fs.writeFile(POSTS_PATH, JSON.stringify(postsData, null, 2));
        }
        res.json({ isLiked, likeCount });
    } catch (error) {
        if (error.message === '인증되지 않은 사용자입니다.') {
            return res.status(401).json({ error: error.message });
        }
        console.error('좋아요 처리 중 오류:', error);
        res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
    }
};

// 좋아요 상태 확인 컨트롤러
export const checkLikeStatus = async (req, res) => {
    try {
        const { postId } = req.params;
        // const userId = getUserIdentifier(req);
        // 일단 유저아이디 그냥 다 random으로 만듬
        const userId = Math.random().toString(36).substring(7);

        await ensureLikesFile();

        // 좋아요 데이터 읽기
        const likesData = JSON.parse(await fs.readFile(LIKES_PATH, 'utf-8'));

        // 해당 포스트와 유저의 좋아요 확인
        const isLiked = likesData.some(
            like => like.postId === parseInt(postId) && like.userId === userId,
        );

        res.json({ isLiked });
    } catch (error) {
        if (error.message === '인증되지 않은 사용자입니다.') {
            return res.status(401).json({ error: error.message });
        }
        console.error('좋아요 상태 확인 중 오류:', error);
        res.status(500).json({
            error: '좋아요 상태 확인 중 오류가 발생했습니다.',
        });
    }
};

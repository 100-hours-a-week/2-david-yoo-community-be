/*
 * 게시글 관련 컨트롤러
 * 게시글의 생성, 조회, 수정, 삭제 등 CRUD 작업을 처리
 * Multer를 사용한 이미지 업로드와 데이터베이스 작업을 결합
 * 페이지네이션을 지원하는 게시글 목록 조회 기능 구현
 */

import pool from '../config/database.js';
import { upload, deleteFile, getImageUrl } from '../utils/fileUtils.js';
import {
    validateTitle,
    validateFile,
    validateId,
} from '../utils/validationUtils.js';

// 게시글 작성 처리
// @param {Object} req.body - 요청 본문
// @param {string} req.body.title - 게시글 제목
// @param {string} req.body.content - 게시글 내용
// @param {string} req.body.nickname - 작성자 닉네임
// @param {string} req.body.author_email - 작성자 이메일
// @param {File} req.file - 업로드된 이미지 파일
// @returns {Object} 생성된 게시글 정보
export const createPost = async (req, res) => {
    // Multer 미들웨어를 통한 파일 업로드 처리
    req.uploadType = 'posts';
    upload.single('image')(req, res, async err => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(400).json({ error: 'File upload failed' });
        }

        try {
            const { title, content, nickname, author_email } = req.body;
            // 필드 검증
            if (!title || !content || !author_email) {
                return res.status(400).json({
                    error: 'Title, content, and author email are required',
                });
            }

            // 이미지 경로 설정 (업로드된 경우)
            const imagePath = req.file ? req.savedFileName : null;

            // 게시글 데이터베이스 저장
            const [result] = await pool.query(
                `INSERT INTO posts (title, content, nickname, author_email, image, views, comments_count, like_count) 
                 VALUES (?, ?, ?, ?, ?, 0, 0, 0)`,
                [title, content, nickname || '익명', author_email, imagePath],
            );

            // 생성된 게시글 정보 조회
            const [newPost] = await pool.query(
                'SELECT * FROM posts WHERE id = ?',
                [result.insertId],
            );

            // 이미지 URL 추가
            const post = newPost[0];
            if (post.image) {
                post.imageUrl = getImageUrl(post.image.split('/').pop(), false);
            }

            res.json({
                success: true,
                post: post,
            });
        } catch (err) {
            console.error('Post creation error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    });
};

// 게시글 목록 조회
// @param {Object} req.query - 쿼리 파라미터
// @param {number} req.query.page - 페이지 번호 (기본값: 1)
// @param {number} req.query.limit - 페이지당 게시글 수 (기본값: 10)
// @returns {Object} 게시글 목록, 페이지네이션 정보
export const getPosts = async (req, res) => {
    // 페이지네이션 파라미터 설정
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // 전체 게시글 수 조회
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM posts',
        );
        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        // 페이지네이션이 적용된 게시글 목록 조회 (users 테이블과 조인)
        const [posts] = await pool.query(
            `SELECT 
                p.*,
                u.nickname as current_nickname
            FROM posts p
            LEFT JOIN users u ON p.author_email = u.email
            ORDER BY p.created_at DESC 
            LIMIT ? OFFSET ?`,
            [limit, offset],
        );

        // 최신 닉네임과 이미지 URL이 포함된 게시글 목록
        const postsWithUrls = posts.map(post => ({
            ...post,
            nickname: post.current_nickname,
            imageUrl: post.image
                ? getImageUrl(post.image.split('/').pop(), false)
                : null,
        }));

        res.json({
            posts: postsWithUrls,
            currentPage: page,
            totalPages: totalPages,
            totalPosts: totalPosts,
            postsPerPage: limit,
        });
    } catch (err) {
        console.error('Error reading posts:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// 특정 게시글 조회
// @param {number} req.params.id - 게시글 ID
// @returns {Object} 게시글 상세 정보
export const getPostById = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    try {
        // ID로 게시글 조회
        const [posts] = await pool.query(
            `SELECT 
                p.*,
                u.nickname as current_nickname
            FROM posts p
            LEFT JOIN users u ON p.author_email = u.email
            WHERE p.id = ?`,
            [postId],
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        const post = {
            ...posts[0],
            nickname: posts[0].current_nickname || posts[0].nickname, // 최신 닉네임이 있으면 사용, 없으면 기존 닉네임 유지
            imageUrl: posts[0].image ? getImageUrl(posts[0].image.split('/').pop(), false) : null
        };
        delete post.current_nickname;

        res.json({
            success: true,
            post: posts[0],
        });
    } catch (err) {
        console.error('게시글 조회 에러:', err);
        return res.status(500).json({
            success: false,
            message: '서버 오류',
        });
    }
};

// 게시글 수정
// @param {number} req.params.id - 수정할 게시글 ID
// @param {Object} req.body - 요청 본문
// @param {string} req.body.title - 수정할 제목
// @param {string} req.body.content - 수정할 내용
// @param {string} req.body.nickname - 수정할 닉네임
// @param {File} req.file - 새로 업로드된 이미지 파일
// @returns {Object} 수정된 게시글 정보
export const updatePost = async (req, res) => {
    req.uploadType = 'posts';
    upload.single('image')(req, res, async err => {
        if (err) {
            console.error('파일 업로드 에러:', err);
            return res
                .status(400)
                .json({ error: '파일 업로드에 실패했습니다.' });
        }

        const postId = parseInt(req.params.id, 10);
        const { title, content, nickname } = req.body;

        // 입력된 값이 있는 경우에만 검증
        if (title) {
            const titleValidation = validateTitle(title);
            if (!titleValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: titleValidation.message,
                });
            }
        }

        // 파일 검증 (있는 경우)
        if (req.file) {
            const fileValidation = validateFile(req.file);
            if (!fileValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: fileValidation.message,
                });
            }
        }

        try {
            // 기존 게시글 조회
            const [existingPost] = await pool.query(
                'SELECT * FROM posts WHERE id = ?',
                [postId],
            );

            if (existingPost.length === 0) {
                return res.status(404).send('게시글을 찾을 수 없습니다.');
            }

            // 새 이미지가 업로드된 경우 기존 이미지 삭제
            if (existingPost[0].image && req.file) {
                await deleteFile(existingPost[0].image);
            }

            // 게시글 업데이트
            const [result] = await pool.query(
                `UPDATE posts 
                 SET title = ?, content = ?, nickname = ?, image = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    title || existingPost[0].title,
                    content || existingPost[0].content,
                    nickname || existingPost[0].nickname,
                    req.file
                        ? req.file.key
                        : existingPost[0].image,
                    postId,
                ],
            );

            // 수정된 게시글 정보 조회
            const [updatedPost] = await pool.query(
                'SELECT * FROM posts WHERE id = ?',
                [postId],
            );

            res.json({
                success: true,
                post: updatedPost[0],
            });
        } catch (err) {
            console.error('게시글 업데이트 에러:', err);
            return res.status(500).json({ error: '서버 오류' });
        }
    });
};

// 게시글 삭제
// @param {number} req.params.id - 삭제할 게시글 ID
// @returns {Object} 삭제 결과 메시지
export const deletePost = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    // postId 검증
    const postIdValidation = validateId(postId);
    if (!postIdValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: postIdValidation.message,
        });
    }

    try {
        // 삭제할 게시글이 존재하는지 확인
        const [post] = await pool.query('SELECT * FROM posts WHERE id = ?', [
            postId,
        ]);

        if (post.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        // 게시글 삭제
        await pool.query('DELETE FROM posts WHERE id = ?', [postId]);

        res.json({
            success: true,
            message: '게시글이 성공적으로 삭제되었습니다.',
        });
    } catch (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({
            success: false,
            message: '서버 오류',
        });
    }
};
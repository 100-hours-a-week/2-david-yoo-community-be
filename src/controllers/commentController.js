/*
 * 댓글 관련 컨트롤러
 * 댓글의 생성, 조회, 수정, 삭제 등 CRUD 작업 처리
 * 트랜잭션을 사용하여 댓글 수 업데이트와 같은 연관 작업의 일관성 보장
 */

import pool from '../config/database.js';
import { validateId, validateContent } from '../utils/validationUtils.js';

// 댓글 작성
// @param {Object} req.body - 요청 본문
// @param {number} req.body.postId - 게시글 ID
// @param {string} req.body.content - 댓글 내용
// @param {string} req.body.author_email - 작성자 이메일
// @returns {Object} 생성된 댓글 정보와 업데이트된 댓글 수
export const addComment = async (req, res) => {
    const { postId, content, author_email } = req.body;

    // 로그인 검증
    if (!author_email) {
        return res.status(400).json({
            success: false,
            message: '로그인이 필요합니다.',
        });
    }
    // postId 검증
    const postIdValidation = validateId(postId);
    if (!postIdValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: postIdValidation.message,
        });
    }
    // 내용 검증 (댓글이므로 isPost = false)
    const contentValidation = validateContent(content, false);
    if (!contentValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: contentValidation.message,
        });
    }

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 게시글 존재 여부 확인
            const [posts] = await connection.query(
                'SELECT id FROM posts WHERE id = ?',
                [postId],
            );

            if (posts.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.',
                });
            }

            // 댓글 추가
            const [result] = await connection.query(
                `INSERT INTO comments (
                    post_id, content, author_email
                ) VALUES (?, ?, ?)`,
                [postId, content, author_email],
            );

            // posts 테이블의 comments_count 업데이트
            await connection.query(
                `UPDATE posts 
                 SET comments_count = (
                     SELECT COUNT(*) 
                     FROM comments 
                     WHERE post_id = ?
                 )
                 WHERE id = ?`,
                [postId, postId],
            );

            await connection.commit();

            // 추가된 댓글 정보 조회
            const [newComment] = await connection.query(
                `SELECT 
                    c.*,
                    u.nickname as author_nickname
                FROM comments c
                LEFT JOIN users u ON c.author_email = u.email
                WHERE c.id = ?`,
                [result.insertId],
            );

            // 업데이트된 댓글 수 조회
            const [updatedPost] = await connection.query(
                'SELECT comments_count FROM posts WHERE id = ?',
                [postId],
            );

            connection.release();
            res.status(201).json({
                success: true,
                comment: {
                    ...newComment[0],
                    author: newComment[0].author_nickname,
                },
                commentCount: updatedPost[0].comments_count,
            });
        } catch (error) {
            // 오류 발생 시 트랜잭션 롤백
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 댓글 목록 조회
// @param {Object} req.params - URL 파라미터
// @param {number} req.params.postId - 게시글 ID
// @returns {Object} 댓글 목록
export const getComments = async (req, res) => {
    const { postId } = req.params;

    // postId 검증
    const postIdValidation = validateId(postId);
    if (!postIdValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: postIdValidation.message,
        });
    }

    try {
        // 게시글에 달린 댓글 목록 조회 (작성자 닉네임 포함)
        const [comments] = await pool.query(
            `SELECT 
                c.*,
                u.nickname as author_nickname
            FROM comments c
            LEFT JOIN users u ON c.author_email = u.email
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC`,
            [postId],
        );

        res.json({
            success: true,
            comments,
        });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 댓글 삭제
// @param {Object} req.params - URL 파라미터
// @param {number} req.params.id - 삭제할 댓글 ID
// @param {Object} req.body - 요청 본문
// @param {string} req.body.author_email - 댓글 작성자 이메일
// @returns {Object} 삭제 결과와 업데이트된 댓글 수
export const deleteComment = async (req, res) => {
    const commentId = parseInt(req.params.id);
    const { author_email } = req.body;

    // 인증 검증
    if (!author_email) {
        return res.status(400).json({
            success: false,
            message: '인증 정보가 없습니다.',
        });
    }

    // commentId 검증
    const commentIdValidation = validateId(commentId);
    if (!commentIdValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: commentIdValidation.message,
        });
    }

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 댓글 존재 여부와 작성자 확인
            const [comments] = await connection.query(
                'SELECT * FROM comments WHERE id = ? AND author_email = ?',
                [commentId, author_email],
            );

            if (comments.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(403).json({
                    success: false,
                    message: '댓글을 삭제할 권한이 없습니다.',
                });
            }

            const postId = comments[0].post_id;

            // 댓글 삭제
            await connection.query('DELETE FROM comments WHERE id = ?', [
                commentId,
            ]);

            // posts 테이블의 comments_count 업데이트
            await connection.query(
                `UPDATE posts 
                 SET comments_count = (
                     SELECT COUNT(*) 
                     FROM comments 
                     WHERE post_id = ?
                 )
                 WHERE id = ?`,
                [postId, postId],
            );

            // 업데이트된 댓글 수 조회
            const [updatedPost] = await connection.query(
                'SELECT comments_count FROM posts WHERE id = ?',
                [postId],
            );

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                message: '댓글이 성공적으로 삭제되었습니다.',
                commentCount: updatedPost[0].comments_count,
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 댓글 수정 처리
// @param {Object} req.params - URL 파라미터
// @param {number} req.params.id - 수정할 댓글 ID
// @param {Object} req.body - 요청 본문
// @param {string} req.body.content - 수정할 댓글 내용
// @param {string} req.body.author_email - 댓글 작성자 이메일
// @returns {Object} 수정된 댓글 정보
export const updateComment = async (req, res) => {
    const commentId = parseInt(req.params.id);
    const { content, author_email } = req.body;

    // 인증 검증
    if (!author_email) {
        return res.status(400).json({
            success: false,
            message: '인증 정보가 없습니다.',
        });
    }

    // commentId 검증
    const commentIdValidation = validateId(commentId);
    if (!commentIdValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: commentIdValidation.message,
        });
    }

    // 내용 검증 (댓글이므로 isPost = false)
    const contentValidation = validateContent(content, false);
    if (!contentValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: contentValidation.message,
        });
    }

    try {
        // 댓글 소유권 확인
        const [comments] = await pool.query(
            'SELECT * FROM comments WHERE id = ? AND author_email = ?',
            [commentId, author_email],
        );

        if (comments.length === 0) {
            return res.status(403).json({
                success: false,
                message: '댓글을 수정할 권한이 없습니다.',
            });
        }

        // 댓글 수정
        await pool.query(
            'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, commentId],
        );

        // 수정된 댓글 정보 조회 (작성자 닉네임 포함)
        const [updatedComment] = await pool.query(
            `SELECT 
                c.*,
                u.nickname as author_nickname
            FROM comments c
            LEFT JOIN users u ON c.author_email = u.email
            WHERE c.id = ?`,
            [commentId],
        );

        res.json({
            success: true,
            comment: updatedComment[0],
            message: '댓글이 성공적으로 수정되었습니다.',
        });
    } catch (error) {
        console.error('댓글 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};
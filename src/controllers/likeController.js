/*
 * 좋아요 관련 컨트롤러
 * 게시글 좋아요 추가/삭제 및 상태 확인 기능을 처리
 * 트랜잭션을 사용하여 좋아요 수 업데이트의 데이터 일관성 보장
 */

import pool from '../config/database.js';

// 좋아요 상태 업데이트 처리
// @param {number} req.params.postId - 게시글 ID
// @param {Object} req.body - 요청 본문
// @param {boolean} req.body.is_liked - 좋아요 상태 (true: 추가, false: 삭제)
// @param {string} req.body.email - 사용자 이메일
// @returns {Object} 업데이트된 좋아요 정보 (게시글 ID, 좋아요 수, 현재 상태)
export const updateLikes = async (req, res) => {
    const postId = parseInt(req.params.postId);
    const { is_liked, email } = req.body;

    if (typeof is_liked !== 'boolean' || !email) {
        return res.status(400).json({
            success: false,
            message: '잘못된 요청입니다.',
        });
    }

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            if (is_liked) {
                // 좋아요 추가 (중복 추가 방지를 위해 ON DUPLICATE KEY UPDATE 사용)
                const [insertResult] = await connection.query(
                    'INSERT INTO likes (post_id, user_email, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE created_at = NOW()',
                    [postId, email],
                );

                // 새로운 좋아요인 경우에만 카운트 증가
                if (
                    insertResult.affectedRows > 0 &&
                    !insertResult.warningCount
                ) {
                    await connection.query(
                        'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
                        [postId],
                    );
                }
            } else {
                // 좋아요 삭제
                const [deleteResult] = await connection.query(
                    'DELETE FROM likes WHERE post_id = ? AND user_email = ?',
                    [postId, email],
                );

                // 게시글의 좋아요 수 감소
                if (deleteResult.affectedRows > 0) {
                    await connection.query(
                        'UPDATE posts SET like_count = like_count - 1 WHERE id = ?',
                        [postId],
                    );
                }
            }

            // 업데이트된 게시글 정보 조회
            const [posts] = await connection.query(
                'SELECT * FROM posts WHERE id = ?',
                [postId],
            );

            // 현재 사용자의 좋아요 상태 확인
            const [likes] = await connection.query(
                'SELECT COUNT(*) as liked FROM likes WHERE post_id = ? AND user_email = ?',
                [postId, email],
            );

            await connection.commit();
            connection.release();

            // 게시글이 존재하지 않는 경우
            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.',
                });
            }

            const post = posts[0];
            const isCurrentlyLiked = likes[0].liked > 0;

            return res.status(200).json({
                success: true,
                post_id: post.id,
                post_likes: post.like_count,
                is_liked: isCurrentlyLiked,
            });
        } catch (error) {
            // 오류 발생 시 트랜잭션 롤백
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('좋아요 업데이트 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 좋아요 상태 확인
// @param {number} req.params.postId - 게시글 ID
// @param {string} req.query.email - 사용자 이메일
// @returns {Object} 게시글의 좋아요 정보 (총 좋아요 수, 사용자의 좋아요 여부)
export const checkLikeStatus = async (req, res) => {
    const postId = parseInt(req.params.postId);
    const email = req.query.email;

    // 이메일 체크
    if (!email) {
        return res.status(400).json({
            success: false,
            message: '사용자 이메일이 필요합니다.',
        });
    }

    try {
        // 게시글 정보와 사용자의 좋아요 상태를 함께 조회
        // IFNULL을 사용하여 좋아요하지 않은 경우 NULL 처리
        const [posts] = await pool.query(
            'SELECT p.*, IFNULL(l.user_email, NULL) as user_liked FROM posts p ' +
                'LEFT JOIN likes l ON p.id = l.post_id AND l.user_email = ? ' +
                'WHERE p.id = ?',
            [email, postId],
        );

        // 게시글이 존재하지 않는 경우
        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        return res.status(200).json({
            success: true,
            post_id: postId,
            post_likes: posts[0].like_count,
            is_liked: posts[0].user_liked !== null,
        });
    } catch (error) {
        console.error('좋아요 상태 확인 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};
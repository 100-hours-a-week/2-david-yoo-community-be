/*
 * 조회수 관련 컨트롤러
 * 게시글의 조회수 증가 및 조회 기능을 처리
 * 데이터베이스의 원자성을 보장하기 위해 UPDATE 쿼리 사용
 */

import pool from '../config/database.js';

// 조회수 증가 처리
// @param {number} req.params.id - 게시글 ID
// @returns {Object} 업데이트된 조회수 정보
export const incrementViews = async (req, res) => {
    const postId = parseInt(req.params.id);

    try {
        // 조회수 증가
        const [result] = await pool.query(
            'UPDATE posts SET views = views + 1 WHERE id = ?',
            [postId],
        );

        // 게시글이 존재하지 않는 경우
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        // 업데이트된 조회수 조회
        const [posts] = await pool.query(
            'SELECT views FROM posts WHERE id = ?',
            [postId],
        );

        res.json({
            success: true,
            views: posts[0].views,
        });
    } catch (error) {
        console.error('조회수 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 조회수 조회
// @param {number} req.params.id - 게시글 ID
// @returns {Object} 현재 조회수 정보
export const getViews = async (req, res) => {
    const postId = parseInt(req.params.id);

    try {
        // 현재 조회수 조회
        const [posts] = await pool.query(
            'SELECT views FROM posts WHERE id = ?',
            [postId],
        );

        // 게시글이 존재하지 않는 경우
        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        res.json({
            success: true,
            views: posts[0].views,
        });
    } catch (error) {
        console.error('조회수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

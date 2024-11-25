/*
 * 사용자 정보 관련 컨트롤러
 * 프로필 이미지, 닉네임, 비밀번호 등 사용자 정보 업데이트를 처리
 * 파일 시스템을 활용한 프로필 이미지 처리와 데이터베이스 작업을 결합
 */

import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { saveBase64Image, deleteFile } from '../utils/fileUtils.js';

// 닉네임 업데이트
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 사용자 이메일
// @param {string} req.body.nickname - 새로운 닉네임
// @returns {Object} 업데이트 결과
export const updateNickname = async (req, res) => {
    const { email, nickname } = req.body;

    try {
        // 닉네임 업데이트 실행
        const [result] = await pool.query(
            'UPDATE users SET nickname = ? WHERE email = ?',
            [nickname, email],
        );

        // 업데이트된 행이 없는 경우 사용자가 존재하지 않음
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('닉네임 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 프로필 이미지 업데이트
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 사용자 이메일
// @param {string} req.body.profileImage - 새로운 프로필 이미지 (base64)
// @returns {Object} 업데이트된 이미지 정보
export const updateProfileImage = async (req, res) => {
    const { email, profileImage } = req.body;

    try {
        // 기존 사용자 정보 조회
        const [users] = await pool.query(
            'SELECT profile_image FROM users WHERE email = ?',
            [email],
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        let profileImageName = users[0].profile_image;

        // 새로운 이미지가 제공된 경우 처리
        if (profileImage && profileImage.startsWith('data:image')) {
            // 기존 이미지 삭제 (기본 이미지가 아닌 경우)
            if (profileImageName && profileImageName !== 'default.webp') {
                await deleteFile(profileImageName, true); // isProfile = true
            }

            // 새 이미지 저장
            profileImageName = await saveBase64Image(profileImage, email, true); // isProfile = true

            // 데이터베이스 업데이트
            await pool.query(
                'UPDATE users SET profile_image = ? WHERE email = ?',
                [profileImageName, email],
            );
        }

        res.status(200).json({
            success: true,
            profileImage: profileImageName,
            imageUrl: `http://localhost:3000/uploads/profiles/${profileImageName}`,
            message: 'Profile image updated successfully',
        });
    } catch (error) {
        console.error('Profile image update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// 프로필 이미지 조회
// @param {string} req.params.email - 사용자 이메일
// @returns {Object} 프로필 이미지 정보
export const getProfileImage = async (req, res) => {
    const { email } = req.params;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // 사용자 정보 조회
        const [users] = await pool.query(
            'SELECT email, nickname, profile_image FROM users WHERE email = ?',
            [email],
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // 기본 이미지 경로 설정
        const user = users[0];
        const profileImage = user.profile_image || 'profiles/default.webp';

        res.json({
            success: true,
            profileImage: profileImage,
            imageUrl: `http://localhost:3000/uploads/${profileImage}`,
        });
    } catch (error) {
        console.error('Profile image fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// 비밀번호 변경
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 사용자 이메일
// @param {string} req.body.newPassword - 새로운 비밀번호
// @returns {Object} 변경 결과 메시지
export const changePassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // 새 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email],
        );

        // 업데이트된 행이 없는 경우 사용자가 존재하지 않음
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }

        res.status(200).json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.',
        });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

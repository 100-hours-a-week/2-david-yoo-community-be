/*
 * 인증 관련 컨트롤러
 * 회원가입, 로그인, 로그아웃, 회원탈퇴 등의 사용자 인증 기능을 처리
 * bcrypt를 사용한 비밀번호 암호화와 세션 기반 인증을 구현
 */

import bcrypt from 'bcrypt';
import { saveBase64Image } from '../utils/fileUtils.js';
import pool from '../config/database.js';

// 회원가입 처리
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 사용자 이메일
// @param {string} req.body.password - 사용자 비밀번호
// @param {string} req.body.nickname - 사용자 닉네임
// @param {string} req.body.profileImage - 프로필 이미지 (base64)
// @returns {Object} 회원가입 결과 메시지
export const signup = async (req, res) => {
    const { email, password, nickname, profileImage } = req.body;
    let profileImageName = 'default.webp';

    try {
        // SQL 쿼리 실행 전 데이터 로깅
        console.log('Inserting user with data:', {
            email,
            nickname,
            profileImageName,
        });

        // 프로필 이미지 처리
        if (profileImage && profileImage !== 'default.webp') {
            profileImageName = await saveBase64Image(profileImage, email, true);
        }

        // 이메일 중복 체크
        const [existingUsers] = await pool.query(
            'SELECT email FROM users WHERE email = ?',
            [email],
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.',
            });
        }

        // bcrypt를 사용한 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 정보 데이터베이스 저장
        const [result] = await pool.query(
            'INSERT INTO users (email, password, nickname, profile_image) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, nickname, profileImageName],
        );

        res.status(201).json({
            success: true,
            message: '회원가입 성공',
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 회원 탈퇴 처리
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 탈퇴할 사용자 이메일
// @returns {Object} 탈퇴 처리 결과 메시지
export const withdrawUser = async (req, res) => {
    const { email } = req.body;

    try {
        // 사용자 삭제 처리
        const [result] = await pool.query('DELETE FROM users WHERE email = ?', [
            email,
        ]);

        // 삭제된 행이 없는 경우 사용자가 존재하지 않음
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }

        // 세션이 존재하는 경우 세션 삭제
        if (req.session) {
            req.session.destroy();
        }

        res.status(200).json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.',
        });
    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 로그인 처리
// @param {Object} req.body - 요청 본문
// @param {string} req.body.email - 사용자 이메일
// @param {string} req.body.password - 사용자 비밀번호
// @returns {Object} 로그인 결과 및 사용자 정보
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 이메일로 사용자 조회
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email],
        );

        const user = users[0];

        // 사용자가 존재하지 않는 경우
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }

        // bcrypt를 사용한 비밀번호 검증
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }

        // 세션에 사용자 정보 저장
        req.session.user = {
            email: user.email,
            nickname: user.nickname,
        };

        res.status(200).json({
            success: true,
            nickname: user.nickname,
            user: req.session.user,
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 로그아웃 처리
// @param {Object} req - 요청 객체 (세션 정보 포함)
// @returns {Object} 로그아웃 처리 결과 메시지
export const logout = (req, res) => {
    // 세션 삭제
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '로그아웃 처리 중 오류가 발생했습니다.',
            });
        }
        // 세션 쿠키 삭제
        res.clearCookie('connect.sid');
        res.status(200).json({
            success: true,
            message: '로그아웃 되었습니다.',
        });
    });
};

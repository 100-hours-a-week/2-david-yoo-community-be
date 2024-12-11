/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateEmail = email => {
    if (!email) {
        return {
            isValid: false,
            message: '이메일은 필수 항목입니다.',
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            message: '유효하지 않은 이메일 형식입니다.',
        };
    }

    if (email.length > 50) {
        return {
            isValid: false,
            message: '이메일은 50자를 초과할 수 없습니다.',
        };
    }

    return { isValid: true };
};

/**
 * 비밀번호 형식 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validatePassword = password => {
    if (!password) {
        return {
            isValid: false,
            message: '비밀번호는 필수 항목입니다.',
        };
    }

    if (password.length < 8) {
        return {
            isValid: false,
            message: '비밀번호는 최소 8자 이상이어야 합니다.',
        };
    }

    if (password.length > 20) {
        return {
            isValid: false,
            message: '비밀번호는 20자를 초과할 수 없습니다.',
        };
    }

    // 최소 하나의 대문자, 숫자, 특수문자 포함
    const passwordRegex = /(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
        return {
            isValid: false,
            message:
                '비밀번호는 최소 하나의 대문자, 숫자, 특수문자를 포함해야 합니다.',
        };
    }

    return { isValid: true };
};

/**
 * 닉네임 형식 검증
 * @param {string} nickname - 검증할 닉네임
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateNickname = nickname => {
    if (!nickname) {
        return {
            isValid: false,
            message: '닉네임은 필수 항목입니다.',
        };
    }

    if (nickname.length < 2 || nickname.length > 20) {
        return {
            isValid: false,
            message: '닉네임은 2자 이상 20자 이하여야 합니다.',
        };
    }

    // 한글, 영문, 숫자, 하이픈만 허용
    const nicknameRegex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_-]+$/;
    if (!nicknameRegex.test(nickname)) {
        return {
            isValid: false,
            message: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
        };
    }

    return { isValid: true };
};

/**
 * ID 형식 검증
 * @param {string|number} id - 검증할 ID
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateId = id => {
    if (!id) {
        return {
            isValid: false,
            message: 'ID는 필수 항목입니다.',
        };
    }

    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
        return {
            isValid: false,
            message: '유효하지 않은 ID 형식입니다.',
        };
    }

    return { isValid: true };
};

/**
 * 게시글/댓글 내용 검증
 * @param {string} content - 검증할 내용
 * @param {boolean} isPost - 게시글 여부 (true: 게시글, false: 댓글)
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateContent = (content, isPost = false) => {
    if (!content) {
        return {
            isValid: false,
            message: '내용은 필수 항목입니다.',
        };
    }

    // 게시글과 댓글의 길이 제한을 다르게 설정
    const minLength = isPost ? 10 : 1;
    const maxLength = isPost ? 2000 : 500;

    if (content.length < minLength || content.length > maxLength) {
        return {
            isValid: false,
            message: `내용은 ${minLength}자 이상 ${maxLength}자 이하여야 합니다.`,
        };
    }

    return { isValid: true };
};

/**
 * 게시글 제목 검증
 * @param {string} title - 검증할 제목
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateTitle = title => {
    if (!title) {
        return {
            isValid: false,
            message: '제목은 필수 항목입니다.',
        };
    }

    if (title.length < 2 || title.length > 100) {
        return {
            isValid: false,
            message: '제목은 2자 이상 100자 이하여야 합니다.',
        };
    }

    return { isValid: true };
};

/**
 * Base64 이미지 검증
 * @param {string} base64String - 검증할 Base64 이미지 문자열
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateBase64Image = base64String => {
    if (!base64String) {
        return { isValid: true }; // 이미지는 선택사항
    }

    if (!base64String.match(/^data:image\/(jpeg|png|gif|webp);base64,/)) {
        return {
            isValid: false,
            message:
                '유효하지 않은 이미지 형식입니다. (jpg, png, gif, webp만 가능)',
        };
    }

    // Base64 크기 검증 (5MB 제한)
    const base64Data = base64String.split(',')[1];
    const fileSize = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024;

    if (fileSize > maxSize) {
        return {
            isValid: false,
            message: '이미지 크기는 5MB를 초과할 수 없습니다.',
        };
    }

    return { isValid: true };
};

/**
 * 파일 검증
 * @param {Object} file - 검증할 파일 객체
 * @returns {Object} 검증 결과 객체 {isValid: boolean, message: string}
 */
export const validateFile = file => {
    if (!file) {
        return { isValid: true }; // 파일은 선택사항
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        return {
            isValid: false,
            message:
                '지원하지 않는 파일 형식입니다. (jpg, png, gif, webp만 가능)',
        };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            isValid: false,
            message: '파일 크기는 5MB를 초과할 수 없습니다.',
        };
    }

    return { isValid: true };
};
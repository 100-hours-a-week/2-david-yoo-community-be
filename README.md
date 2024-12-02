# 2-david-yoo-community-be

# 커뮤니티 게시판 프로젝트 Backend

## 프로젝트 소개
게시판 기능을 제공하는 서버입니다. Express.js와 MariaDB를 기반으로 구현되었으며, 사용자 인증, 게시글 관리, 댓글, 좋아요 등 다양한 기능을 제공합니다.

## 기술 스택
<img src="https://img.shields.io/badge/Amazon AWS-232F3E?style=flat-square&logo=amazonaws&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=Express&logoColor=white"/>
<img src="https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariaDB&logoColor=white"/>

## 주요 기능
- **사용자 관리**
  - 회원가입/로그인/로그아웃
  - 프로필 이미지 업로드
  - 닉네임 변경
  - 비밀번호 변경
  - 회원 탈퇴

- **게시글**
  - 게시글 CRUD
  - 이미지 업로드
  - 조회수 관리
  - 페이지네이션

- **댓글**
  - 댓글 CRUD
  - 작성자 정보 표시

- **좋아요**
  - 게시글 좋아요/취소
  - 좋아요 상태 확인

## 기술 스택

- **Backend**
  - Node.js
  - Express.js

- **데이터베이스**
  - MariaDB

- **인증**
  - express-session
  - bcrypt (비밀번호 암호화)

- **파일 처리**
  - Multer (파일 업로드)
  - Base64 이미지 처리

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/100-hours-a-week/2-david-yoo-community-be.git
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 설정하세요:
```env
PORT=3000
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
SESSION_SECRET=
```


4. 서버 실행
```bash
npm start
```

## API 엔드포인트

### 인증
- `POST /auth/signup` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `POST /auth/withdraw` - 회원탈퇴

### 사용자
- `PUT /user/nickname` - 닉네임 변경
- `PUT /user/profile-image` - 프로필 이미지 변경
- `GET /user/profile-image/:email` - 프로필 이미지 조회
- `PUT /user/password` - 비밀번호 변경

### 게시글
- `POST /posts` - 게시글 작성
- `GET /posts` - 게시글 목록 조회
- `GET /posts/:id` - 특정 게시글 조회
- `PUT /posts/:id` - 게시글 수정
- `DELETE /posts/:id` - 게시글 삭제

### 댓글
- `POST /api/comments` - 댓글 작성
- `GET /api/comments/:postId` - 댓글 목록 조회
- `PUT /api/comments/:id` - 댓글 수정
- `DELETE /api/comments/:id` - 댓글 삭제

### 좋아요
- `PUT /api/likes/:postId` - 좋아요 상태 변경
- `GET /api/likes/:postId` - 좋아요 상태 확인

### 조회수
- `POST /api/views/:id/increment` - 조회수 증가
- `GET /api/views/:id` - 조회수 조회
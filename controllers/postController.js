import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
    },
}).single('image'); // single 미들웨어를 여기서 정의

// 파일 필터 설정
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 게시물 생성 로직
export const createPost = async (req, res) => {
    upload(req, res, async err => {
        if (err) {
            console.error('파일 업로드 에러:', err);
            return res
                .status(400)
                .json({ error: '파일 업로드에 실패했습니다.' });
        }

        try {
            const { title, content, nickname } = req.body;

            if (!title || !content || !nickname) {
                return res.status(400).json({
                    error: '필수 필드가 누락되었습니다.',
                });
            }

            const time = new Date().toISOString();
            const newPost = {
                title,
                content,
                nickname,
                time,
                image: req.file ? req.file.filename : null, // 파일명만 저장
            };

            const data = await fs.promises.readFile(
                'data/post-data.json',
                'utf8',
            );
            const posts = JSON.parse(data || '[]');
            const maxId =
                posts.length > 0 ? Math.max(...posts.map(post => post.id)) : 0;
            newPost.id = maxId + 1;
            newPost.views = 0;
            newPost.likeCount = 0;
            newPost.commentsCount = 0;

            posts.push(newPost);
            await fs.promises.writeFile(
                'data/post-data.json',
                JSON.stringify(posts, null, 2),
            );

            res.json({
                success: true,
                post: newPost,
            });
        } catch (err) {
            console.error('게시글 생성 에러:', err);
            return res.status(500).json({ error: '서버 오류' });
        }
    });
};

// 게시물 목록 조회 로직
export const getPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const data = await fs.promises.readFile('data/post-data.json', 'utf8');
        const posts = JSON.parse(data || '[]');
        const totalPosts = posts.length;
        const totalPages = Math.ceil(totalPosts / limit);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedPosts = posts.reverse().slice(startIndex, endIndex);

        res.json({
            posts: paginatedPosts,
            currentPage: page,
            totalPages: totalPages,
            totalPosts: totalPosts,
            postsPerPage: limit,
        });
    } catch (err) {
        console.error('Error reading posts:', err);
        return res.status(500).send('파일 읽기 오류');
    }
};

export const getPostById = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    try {
        const data = await fs.promises.readFile('data/post-data.json', 'utf8');
        const posts = JSON.parse(data || '[]');
        const post = posts.find(p => p.id === postId);

        if (!post) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }

        // 이미지가 있는 경우 Base64로 변환
        if (post.image) {
            try {
                const imagePath = path.join('uploads', post.image);
                const imageData = await fs.promises.readFile(imagePath);
                post.imageData = `data:image/jpeg;base64,${imageData.toString('base64')}`;
            } catch (imageErr) {
                console.error('이미지 로드 실패:', imageErr);
                post.imageData = null;
            }
        }

        res.json(post);
    } catch (err) {
        console.error('게시글 조회 에러:', err);
        return res.status(500).send('서버 오류');
    }
};

// 게시물 업데이트 로직
export const updatePost = async (req, res) => {
    upload(req, res, async err => {
        if (err) {
            console.error('파일 업로드 에러:', err);
            return res
                .status(400)
                .json({ error: '파일 업로드에 실패했습니다.' });
        }

        const postId = parseInt(req.params.id, 10);
        const { title, content, nickname } = req.body;

        try {
            // 기존 게시글 데이터 읽기
            const data = await fs.promises.readFile(
                'data/post-data.json',
                'utf8',
            );
            const posts = JSON.parse(data || '[]');
            const postIndex = posts.findIndex(p => p.id === postId);

            if (postIndex === -1) {
                return res.status(404).send('게시글을 찾을 수 없습니다.');
            }

            // 기존 게시글의 이미지 파일이 있고, 새 이미지가 업로드된 경우 기존 이미지 삭제
            if (posts[postIndex].image && req.file) {
                const oldImagePath = path.join(
                    'uploads',
                    posts[postIndex].image,
                );
                try {
                    await fs.promises.unlink(oldImagePath);
                } catch (error) {
                    console.error('기존 이미지 삭제 실패:', error);
                }
            }

            // 게시글 업데이트
            posts[postIndex] = {
                ...posts[postIndex],
                title: title || posts[postIndex].title,
                content: content || posts[postIndex].content,
                nickname: nickname || posts[postIndex].nickname,
                updatedAt: new Date().toISOString(),
                // 새 이미지가 있으면 업데이트, 없으면 기존 이미지 유지
                image: req.file ? req.file.filename : posts[postIndex].image,
            };

            // 업데이트된 게시글 저장
            await fs.promises.writeFile(
                'data/post-data.json',
                JSON.stringify(posts, null, 2),
            );

            // 응답에 이미지 데이터 포함
            if (posts[postIndex].image) {
                try {
                    const imagePath = path.join(
                        'uploads',
                        posts[postIndex].image,
                    );
                    const imageData = await fs.promises.readFile(imagePath);
                    posts[postIndex].imageData =
                        `data:image/jpeg;base64,${imageData.toString('base64')}`;
                } catch (imageErr) {
                    console.error('이미지 로드 실패:', imageErr);
                    posts[postIndex].imageData = null;
                }
            }

            res.json({
                success: true,
                post: posts[postIndex],
            });
        } catch (err) {
            console.error('게시글 업데이트 에러:', err);
            return res.status(500).send('서버 오류');
        }
    });
};

// 게시물 삭제 로직
export const deletePost = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    try {
        const data = await fs.promises.readFile('data/post-data.json', 'utf8');
        const posts = JSON.parse(data || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.',
            });
        }

        posts.splice(postIndex, 1);

        await fs.promises.writeFile(
            'data/post-data.json',
            JSON.stringify(posts, null, 2),
        );

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

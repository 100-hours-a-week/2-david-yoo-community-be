import fs from 'fs';
import multer from 'multer';
const upload = multer();

// 게시물 생성 로직
export const createPost = [
    upload.none(),
    async (req, res) => {
        try {
            console.log('Parsed Form Data:', req.body);
            const { title, content, nickname } = req.body;
            if (!title || !content || !nickname) {
                console.log('Missing required fields:', {
                    title,
                    content,
                    nickname,
                });
                return res.status(400).json({
                    error: '필수 필드가 누락되었습니다.',
                    receivedData: req.body,
                });
            }

            const time = new Date().toISOString();
            const newPost = { title, content, nickname, time };

            const data = await fs.promises.readFile(
                'data/post-data.json',
                'utf8',
            );
            const posts = JSON.parse(data || '[]');
            const maxId =
                posts.length > 0 ? Math.max(...posts.map(post => post.id)) : 0;
            newPost.id = maxId + 1;
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
            console.error('Error processing post creation:', err);
            return res.status(500).send('서버 오류');
        }
    },
];

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

// 게시물 상세 조회 로직
export const getPostById = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    try {
        const data = await fs.promises.readFile('data/post-data.json', 'utf8');
        const posts = JSON.parse(data || '[]');
        const post = posts.find(p => p.id === postId);

        if (post) {
            res.json(post);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error('Error fetching post by ID:', err);
        return res.status(500).send('서버 오류');
    }
};

// 게시물 업데이트 로직
export const updatePost = async (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { title, content, nickname } = req.body;

    try {
        const data = await fs.promises.readFile('data/post-data.json', 'utf8');
        const posts = JSON.parse(data || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }

        posts[postIndex] = {
            ...posts[postIndex],
            title: title || posts[postIndex].title,
            content: content || posts[postIndex].content,
            nickname: nickname || posts[postIndex].nickname,
            updatedAt: new Date().toISOString(),
        };

        await fs.promises.writeFile(
            'data/post-data.json',
            JSON.stringify(posts, null, 2),
        );

        res.json({
            success: true,
            post: posts[postIndex],
        });
    } catch (err) {
        console.error('Error updating post:', err);
        return res.status(500).send('서버 오류');
    }
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

import fs from 'fs';
import path from 'path';
import multer from 'multer';

const upload = multer();

// 게시물 생성 로직
export const createPost = [
    upload.none(),
    (req, res) => {
        console.log('Parsed Form Data:', req.body);

        const { title, content, nickname } = req.body;
        if (!title || !content || !nickname) {
            console.log('Missing required fields:', {
                title: !!title,
                content: !!content,
                nickname: !!nickname,
            });
            return res.status(400).json({
                error: '필수 필드가 누락되었습니다.',
                receivedData: req.body,
            });
        }

        const time = new Date().toISOString();
        const newPost = { title, content, nickname, time };

        fs.readFile('data/post-data.json', 'utf8', (err, data) => {
            if (err) {
                console.error('File read error:', err);
                return res.status(500).send('서버 오류');
            }

            try {
                const posts = JSON.parse(data || '[]');
                const maxId =
                    posts.length > 0
                        ? Math.max(...posts.map(post => post.id))
                        : 0;
                newPost.id = maxId + 1;
                newPost.commentsCount = 0;
                posts.push(newPost);

                fs.writeFile(
                    'data/post-data.json',
                    JSON.stringify(posts, null, 2),
                    err => {
                        if (err) {
                            console.error('File write error:', err);
                            return res.status(500).send('서버 오류');
                        }
                        res.json({
                            success: true,
                            post: newPost,
                        });
                    },
                );
            } catch (err) {
                console.error('JSON parsing error:', err);
                return res.status(500).send('데이터 처리 오류');
            }
        });
    },
];

// 게시물 목록 조회 로직
export const getPosts = (req, res) => {
    fs.readFile('data/post-data.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('파일 읽기 오류');
        // reverse()로 뒤집기 -> 최신 순으로 게시물을 보여줌
        const posts = JSON.parse(data || '[]');
        const reversedPosts = posts.reverse();

        res.json(reversedPosts);
    });
};

// 게시물 상세 조회 로직
export const getPostById = (req, res) => {
    const postId = parseInt(req.params.id, 10);
    fs.readFile('data/post-data.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('서버 오류');
        const posts = JSON.parse(data || '[]');
        const post = posts.find(p => p.id === postId);
        post
            ? res.json(post)
            : res.status(404).send('게시글을 찾을 수 없습니다.');
    });
};

// 게시물 업데이트 로직
export const updatePost = (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { title, content, nickname } = req.body;

    fs.readFile('data/post-data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('File read error:', err);
            return res.status(500).send('서버 오류');
        }

        try {
            const posts = JSON.parse(data || '[]');
            const postIndex = posts.findIndex(p => p.id === postId);

            if (postIndex === -1) {
                return res.status(404).send('게시글을 찾을 수 없습니다.');
            }

            // 기존 게시글의 정보를 유지하면서 새로운 정보로 업데이트
            posts[postIndex] = {
                ...posts[postIndex],
                title: title || posts[postIndex].title,
                content: content || posts[postIndex].content,
                nickname: nickname || posts[postIndex].nickname,
                updatedAt: new Date().toISOString(),
            };

            fs.writeFile(
                'data/post-data.json',
                JSON.stringify(posts, null, 2),
                err => {
                    if (err) {
                        console.error('File write error:', err);
                        return res.status(500).send('서버 오류');
                    }
                    res.json({
                        success: true,
                        post: posts[postIndex],
                    });
                },
            );
        } catch (err) {
            console.error('JSON parsing error:', err);
            return res.status(500).send('데이터 처리 오류');
        }
    });
};

// 게시물 삭제 로직 추가
export const deletePost = (req, res) => {
    const postId = parseInt(req.params.id, 10);

    fs.readFile('data/post-data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('File read error:', err);
            return res.status(500).json({
                success: false,
                message: '서버 오류',
            });
        }

        try {
            const posts = JSON.parse(data || '[]');
            const postIndex = posts.findIndex(p => p.id === postId);

            if (postIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.',
                });
            }

            // 게시글 삭제
            posts.splice(postIndex, 1);

            fs.writeFile(
                'data/post-data.json',
                JSON.stringify(posts, null, 2),
                err => {
                    if (err) {
                        console.error('File write error:', err);
                        return res.status(500).json({
                            success: false,
                            message: '서버 오류',
                        });
                    }
                    res.json({
                        success: true,
                        message: '게시글이 성공적으로 삭제되었습니다.',
                    });
                },
            );
        } catch (err) {
            console.error('JSON parsing error:', err);
            return res.status(500).json({
                success: false,
                message: '데이터 처리 오류',
            });
        }
    });
};

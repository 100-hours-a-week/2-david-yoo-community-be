import fs from 'fs';
import path from 'path';

const commentInfoPath = path.join(process.cwd(), 'data', 'commentInfo.json');
const postDataPath = path.join(process.cwd(), 'data', 'post-data.json');

// 댓글 작성
export const addComment = (req, res) => {
    const { postId, content, author } = req.body;

    fs.readFile(commentInfoPath, 'utf8', (err, data) => {
        if (err)
            return res.status(500).json({ error: '파일을 읽는 중 오류 발생' });

        const comments = JSON.parse(data || '[]');
        const newComment = {
            id: comments.length + 1,
            postId,
            content,
            author,
            time: new Date().toISOString(),
        };
        comments.push(newComment);

        fs.writeFile(
            commentInfoPath,
            JSON.stringify(comments, null, 2),
            err => {
                if (err)
                    return res
                        .status(500)
                        .json({ error: '파일을 저장하는 중 오류 발생' });

                fs.readFile(postDataPath, 'utf8', (err, postData) => {
                    if (err)
                        return res
                            .status(500)
                            .json({ error: '포스트 파일을 읽는 중 오류 발생' });

                    const posts = JSON.parse(postData || '[]');
                    const postToUpdate = posts.find(
                        post => post.id === parseInt(postId),
                    );

                    if (postToUpdate) {
                        // 댓글 수 증가
                        postToUpdate.commentsCount =
                            (postToUpdate.commentsCount || 0) + 1;

                        fs.writeFile(
                            postDataPath,
                            JSON.stringify(posts, null, 2),
                            err => {
                                if (err)
                                    return res.status(500).json({
                                        error: '포스트를 저장하는 중 오류 발생',
                                    });
                                res.json(newComment);
                            },
                        );
                    } else {
                        res.status(404).json({
                            error: '포스트를 찾을 수 없습니다.',
                        });
                    }
                });
            },
        );
    });
};

export const getComments = (req, res) => {
    const { postId } = req.params;
    fs.readFile(commentInfoPath, 'utf8', (err, data) => {
        if (err)
            return res.status(500).json({ error: '파일을 읽는 중 오류 발생' });

        const comments = JSON.parse(data || '[]');
        const filteredComments = comments.filter(
            comment => comment.postId === postId,
        );
        res.json(filteredComments);
    });
};

// 댓글 삭제
export const deleteComment = async (req, res) => {
    const commentId = parseInt(req.params.id, 10);

    try {
        const commentsData = await fs.promises.readFile(
            'data/commentInfo.json',
            'utf8',
        );
        let comments = JSON.parse(commentsData || '[]');

        const commentIndex = comments.findIndex(c => c.id === commentId);

        if (commentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.',
            });
        }

        const postId = comments[commentIndex].postId;

        comments.splice(commentIndex, 1);

        await fs.promises.writeFile(
            'data/commentInfo.json',
            JSON.stringify(comments, null, 2),
        );

        const postsData = await fs.promises.readFile(
            'data/post-data.json',
            'utf8',
        );
        let posts = JSON.parse(postsData);

        const post = posts.find(p => p.id === postId);
        if (post) {
            post.commentsCount = (post.commentsCount || 0) - 1;
            if (post.commentsCount < 0) post.commentsCount = 0;

            await fs.promises.writeFile(
                'data/posts.json',
                JSON.stringify(posts, null, 2),
            );
        }

        res.json({
            success: true,
            message: '댓글이 성공적으로 삭제되었습니다.',
        });
    } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

// 댓글 수정
export const updateComment = async (req, res) => {
    const commentId = parseInt(req.params.id, 10);
    const { content } = req.body;

    try {
        const commentsData = await fs.promises.readFile(
            'data/commentInfo.json',
            'utf8',
        );
        let comments = JSON.parse(commentsData || '[]');

        const commentIndex = comments.findIndex(c => c.id === commentId);

        if (commentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.',
            });
        }

        // 댓글 업데이트, 날짜 업데이트
        comments[commentIndex] = {
            ...comments[commentIndex],
            content,
            lastModified: new Date().toISOString(),
        };

        await fs.promises.writeFile(
            'data/commentInfo.json',
            JSON.stringify(comments, null, 2),
        );

        res.json({
            success: true,
            comment: comments[commentIndex],
            message: '댓글이 성공적으로 수정되었습니다.',
        });
    } catch (error) {
        console.error('댓글 수정 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
        });
    }
};

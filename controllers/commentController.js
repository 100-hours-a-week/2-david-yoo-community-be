import fs from 'fs';
import path from 'path';

const commentInfoPath = path.join(process.cwd(), 'data', 'commentInfo.json');
const postDataPath = path.join(process.cwd(), 'data', 'post-data.json');

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
                                    return res
                                        .status(500)
                                        .json({
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

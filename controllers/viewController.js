import fs from 'fs';

export const incrementViews = async (req, res) => {
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

        // 조회수 증가
        posts[postIndex].views = (posts[postIndex].views || 0) + 1;
        await fs.promises.writeFile(
            'data/post-data.json',
            JSON.stringify(posts, null, 2),
        );

        res.json({
            success: true,
            views: posts[postIndex].views,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: '서버 오류',
        });
    }
};

import fs from 'fs/promises';
import path from 'path';

const dataPath = path.resolve('./data/post-data.json');

export const getAllPosts = async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        const posts = JSON.parse(data);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: '게시글을 불러오는데 실패했습니다.' });
    }
};

export const createPost = async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        const posts = JSON.parse(data);
        const newPost = { id: Date.now(), ...req.body };
        posts.push(newPost);

        await fs.writeFile(dataPath, JSON.stringify(posts, null, 2));
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: '게시글 생성에 실패했습니다.' });
    }
};

export const updatePost = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        const posts = JSON.parse(data);
        const postIndex = posts.findIndex(post => post.id == id);

        if (postIndex === -1)
            return res
                .status(404)
                .json({ error: '게시글을 찾을 수 없습니다.' });

        posts[postIndex] = { ...posts[postIndex], ...req.body };
        await fs.writeFile(dataPath, JSON.stringify(posts, null, 2));
        res.json(posts[postIndex]);
    } catch (error) {
        res.status(500).json({ error: '게시글 수정에 실패했습니다.' });
    }
};

export const deletePost = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        const posts = JSON.parse(data);
        const updatedPosts = posts.filter(post => post.id != id);

        await fs.writeFile(dataPath, JSON.stringify(updatedPosts, null, 2));
        res.json({ message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: '게시글 삭제에 실패했습니다.' });
    }
};

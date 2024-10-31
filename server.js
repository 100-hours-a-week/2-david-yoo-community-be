import express from 'express';
import postRoutes from './routes/posts.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/posts', postRoutes);

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});

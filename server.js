import express from 'express';
import postRoutes from './routes/posts.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

const dataDir = path.join(path.resolve(), 'data');
const postDataPath = path.join(dataDir, 'post-data.json');

function initializePostData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(postDataPath)) {
    fs.writeFileSync(postDataPath, JSON.stringify([]));
    console.log('post-data.json 파일이 생성되었습니다.');
  }
}

initializePostData();

app.use(express.json());

app.use('/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
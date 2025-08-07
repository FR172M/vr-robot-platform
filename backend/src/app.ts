// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import taskRoutes from './routes/taskRoutes';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const taskId = req.params.taskId;
        const ext = path.extname(file.originalname);
        cb(null, `${taskId}${ext}`);
    }
});

const upload = multer({ storage });

app.use(bodyParser.json());
app.use('/', taskRoutes);
app.use('/api', taskRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/tmp/simulations', express.static(path.join(__dirname, '../tmp/simulations')));


app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running at http://localhost:${PORT}`);
});

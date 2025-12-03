import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import taskRoutes from './routes/taskRoutes';
import codeRoutes from './routes/codeRoutes';
import loginRoutes from './routes/loginRoutes';
import solutionRoutes from "./routes/solutionRoutes";
import userRoutes from "./routes/userRoutes";
import { cleanTmpOnStartup } from './utils/tmpSimulationManager';
import {authenticateJWT} from "./auth/auth";
import {registerUser} from "./controllers/userController";
import {isDocker} from "./utils/dockerRunner";

dotenv.config();
cleanTmpOnStartup();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS konfigurieren, damit Cookies gesendet werden können
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true); // Server-side requests
        if (origin.startsWith('http://localhost') || origin.startsWith('http://192.168.0.') || origin.includes('ngrok')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));


app.use(bodyParser.json());
app.use(cookieParser());  // 👈 Cookies aus Requests lesen

// Routen

// Öffentlich
app.post('/api/register', registerUser); // öffentlich
app.use('/api/auth', loginRoutes);

// Geschützt
app.use('/api/tasks', authenticateJWT, taskRoutes);
app.use('/api/code', authenticateJWT, codeRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/solutions', authenticateJWT, solutionRoutes);
app.use('/api/env', authenticateJWT, (req, res) => {res.json({ isDocker });});

// statische Ordner
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/tmp/simulations', express.static(path.join(__dirname, '../tmp/simulations')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

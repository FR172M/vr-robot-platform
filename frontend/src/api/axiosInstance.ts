// src/api/axiosInstance.ts

import axios, { AxiosInstance } from 'axios';
import {enqueueSnackbar} from "notistack";

// Dynamische Backend-URL zur Laufzeit
export const getBaseUrl = (): string => {
    const host = window.location.hostname;

    // Lokaler Devmodus
    if (host === 'localhost') {
        return 'http://localhost:3000/api';
    }

    // Private IP-Bereiche: 192.168.x.x, 10.x.x.x, 172.16–31.x.x
    const privateIpRegex = /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/;


    if (privateIpRegex.test(host)) {
        return `http://${host}:3000/api`;
    }

    // ngrok oder ähnliche Tunnel
    if (host.includes('ngrok')) {
        return `https://${host}/api`;
    }

    // Production / Docker + Nginx Proxy
    return '/api';
};

export const BASE_URL = getBaseUrl();


const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Cookies automatisch mitschicken
} as any);



let isDocker = false;

export const fetchEnvAPI = async () => {
    try {
        const res = await axios.get('/env');
        isDocker = res.data.isDocker;
        console.log('Docker mode:', isDocker);
        return isDocker;
    } catch (err) {
        console.error('Env fetch failed, assuming dev:', err);
        return false;
    }
};


// Loginfunktion
export const loginAPI = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {email, password});
    // JWT liegt im HttpOnly-Cookie, kein Zugriff in JS
    return res.data; // { role, email, username }
};

// Registrierfunktion
export const registerAPI = async (username: string, email: string, password: string) => {
    const res = await api.post('/register', {username, email, password});
    return res.data; // { role, email, username }
};

// Benutzerinfos holen
interface User {
    role: string;
    email: string;
    username: string;
}

export const fetchMyUserAPI = async (config?: { skipErrorHandler?: boolean }): Promise<User | null> => {
    try {
        const res = await api.get('/auth/me', {
            ...config,
            skipErrorHandler: config?.skipErrorHandler,
        });
        return res.data as User;
    } catch (err) {
        console.error(err);
        return null;
    }
};


// -----------------------------------------------
// Tasks CRUD API
// -----------------------------------------------

export const createTaskAPI = async (taskData: any) => {
    const res = await api.post('/tasks', taskData);
    return res.data;
};

export const updateTaskAPI = async (taskId: string, updatedData: any) => {
    const res = await api.put(`/tasks/${taskId}`, updatedData);
    return res.data;
};

export const deleteTaskAPI = async (taskId: string) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
};

export const fetchTasksAPI = async () => {
    const res = await api.get('/tasks');
    return res.data;
};

export const fetchTaskByIdAPI = async (taskId: string) => {
    try {
        const res = await api.get(`/tasks/${taskId}`);
        return res.data;
    } catch (error) {
        console.error('❌ Error loading taskById:', error);
        return null;
    }
};


// -----------------------------------------------
// Down- und Uploads API
// -----------------------------------------------

export const downloadAPI = async (taskId: string, endpoint: string) => {
    try {
        console.log("➡️ Requesting file from API", `/tasks/${taskId}/${endpoint}`);
        const res = await api.get(`/tasks/${taskId}/${endpoint}`, {
            responseType: "blob",
        });

        console.log("✅ Response received");
        console.log("Response headers:", res.headers);

        const blob = res.data;
        console.log("Blob data:", blob);

        const url = globalThis.URL.createObjectURL(blob);
        console.log("Created object URL:", url);

        const a = document.createElement("a");
        a.href = url;

        const disposition = res.headers["content-disposition"];
        console.log("Content-Disposition header:", disposition);

        {/*
        const filenameMap = {
            "download-worksheet": "worksheet.pdf",
            "download-solution-simulation": "solution.pdf",
            "download-work-simulation": "work.pdf",
        };
        let filename = filenameMap[endpoint] ?? "download.bin";
    */}

        let filename = "download.bin";

        if (disposition) {
            const match = disposition.match(/filename="?(.+?)"?$/);
            if (match && match[1]) {
                filename = match[1];
            }
        }

        console.log("Using filename:", filename);

        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);

        a.click();
        document.body.removeChild(a);
        globalThis.URL.revokeObjectURL(url);
        console.log("✅ Download triggered");

        return true;
    } catch (error) {
        console.error("Download API error:", error);
        throw error;
    }
};



export const uploadWorkSimulationAPI = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('simulation', file);
    const res = await api.post(`/tasks/${taskId}/upload-work-simulation`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
};

export const uploadSolutionSimulationAPI = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('simulation', file);
    const res = await api.post(`/tasks/${taskId}/upload-solution-simulation`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
};

export const uploadWorksheetAPI = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const res = await api.post(`/tasks/${taskId}/upload-worksheet`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
};



// -----------------------------------------------
// Python Code API
// -----------------------------------------------

export const runPythonCodeAPI = async (taskId: string, variant: 'work' | 'solution', code: string) => {
    const res = await api.post('/code/run-python', {taskId, variant, code});
    console.log("___________________res.data________________________")
    console.log(res.data)
    console.log("___________________//________________________")
    return res.data;
};

export const listApiAPI = async (taskId: string, variant: 'work' | 'solution') => {
    const res = await api.get(`/code/list-api/${taskId}/${variant}`);
    console.log("___________________res.data________________________")
    console.log(res.data)
    console.log("___________________//________________________")

    return res.data;
};


// -----------------------------------------------
// Simualtion API
// -----------------------------------------------

export const getSimulationUrlAPI = (taskId: string, variant: 'work' | 'solution') => {
    const base = api.defaults.baseURL!.replace(/\/api$/, '');
    return `${base}/api/tasks/${taskId}/view-simulation/${variant}`;
};


export const simulationKeepaliveAPI = async (taskId: string, variant: 'work' | 'solution') => {
    await api.post(`/tasks/${taskId}/simulation-keepalive/${variant}`);
};

export const simulationClosedAPI = async (taskId: string, variant: 'work' | 'solution') => {
    await api.post(`/tasks/${taskId}/simulation-closed/${variant}`);
};

export const clearTmpAPI = async (taskId: string) => {
    const res = await api.post(`/tasks/${taskId}/clear-tmp`);
    return res.data;
};


// -----------------------------------------------
// Solutions API
// -----------------------------------------------

export const startSolutionAPI = async (taskId: string) => {
    const res = await api.post('/solutions', {task_id: taskId});
    return res.data;
};

export const updateSolutionAPI = async (solutionId: string, code: string) => {
    const res = await api.put(`/solutions/${solutionId}`, {code});
    return res.data;
};

export const submitSolutionAPI = async (solutionId: string, code: string) => {
    const res = await api.put(`/solutions/${solutionId}`, {code, submit: true});
    return res.data;
};

export const fetchMySolutionAPI = async (taskId: string) => {
    const res = await api.get(`/solutions/me/${taskId}`);
    return res.data;
};

export const fetchTaskSolutionsAPI = async (taskId: string) => {
    const res = await api.get(`/solutions/task/${taskId}`);
    return res.data;
};

export const updateGradeAPI = async (solutionId: string, grade: string, feedback: string) => {
    const res = await api.put(`/solutions/task/grade/${solutionId}`, {grade: grade, feedback: feedback});
    return res.data;
};


// -----------------------------------------------
// Users API
// -----------------------------------------------

export interface User {
    id: number;
    email: string;
    role: 'student' | 'teacher';
    username: string;
    created_at: string;
}

// Alle User abrufen (Lehrer/Admin)
export const fetchAllUsersAPI = async (role?: 'student' | 'teacher') => {
    // console.log('fetchAllUsersAPI triggered')
    const res = await api.get('/users', {
        params: role ? {role} : {}
    });
    return res.data;
};


// Einzelnen User abrufen
export const fetchUserByIdAPI = async (userId: number): Promise<User | null> => {
    try {
        const res = await api.get(`/users/${userId}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Failed to fetch user ${userId}:`, err);
        return null;
    }
};

// Rolle ändern (nur Lehrer/Admin)
export const updateUserRoleAPI = async (userId: number, role: 'student' | 'teacher'): Promise<User | null> => {
    try {
        const res = await api.put(`/users/${userId}/role`, {role});
        return res.data;
    } catch (err) {
        console.error(`❌ Failed to update role for user ${userId}:`, err);
        return null;
    }
};

// User löschen (nur Lehrer/Admin)
export const deleteUserAPI = async (userId: number): Promise<{ message: string } | null> => {
    try {
        const res = await api.delete(`/users/${userId}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Failed to delete user ${userId}:`, err);
        return null;
    }
};


export default api;

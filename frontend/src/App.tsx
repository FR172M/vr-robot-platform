// src/App.tsx
import {Routes, Route, Navigate} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import SimulationPage from "./pages/SimulationPage";
import {CustomThemeProvider} from "./ThemeContext";
import React, {useEffect, useState} from "react";

function App() {
    const [role, setRole] = useState<string | null>(sessionStorage.getItem("role"));

    return (
        <CustomThemeProvider>
            <Routes>
                <Route path="/" element={<LandingPage setRole={setRole} />} />

                {role === "teacher" && (
                    <Route path="/teacher" element={<TeacherPage />} />
                )}

                {role === "student" && (
                    <Route path="/student" element={<StudentPage />} />
                )}

                <Route path="/simulation/:taskId" element={<SimulationPage variant="work" />} />

                {
                    // <Route path="*" element={<Navigate to={role ? `/${role}` : "/"} replace/>}/>

                    <Route path="*" element={<Navigate to={role? `/${role}`: "/"} replace />} />
                }
            </Routes>
        </CustomThemeProvider>
    );
}

export default App;

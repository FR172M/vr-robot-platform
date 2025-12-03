import React, {useEffect, useState} from 'react';
import {Routes, Route, Navigate} from "react-router-dom";
import LandingPage from './pages/LandingPage';
import UserPage from './pages/UserPage';
import SimulationPage from './pages/SimulationPage';
import PrivateRoute from './components/PrivateRoute';
import GradingPage from './pages/GradingPage';
import {fetchMyUserAPI} from "./api/axiosInstance";
import RedirectWrapper from "./components/RedirectWrapper";

function App() {

    const [role, setRole] = useState<string | null>(null);
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const user = await fetchMyUserAPI({ skipErrorHandler: true });
                setRole(user?.role || null);
            } finally {
                setLoadingRole(false);
            }
        };
        checkLogin();
    }, []);


    return (

        <Routes>

            <Route
                path="/"
                element={<Navigate to="/redirect" replace/>}
            />

            <Route path="/redirect" element={<RedirectWrapper role={role} loadingRole={loadingRole} />} />


            <Route
                path="/login"
                element={
                    <LandingPage setRole={setRole}/>
                }
            />


            <Route
                path="/teacher"
                element={
                    <PrivateRoute allowedRole="teacher" >
                        <UserPage mode="teacher"/>
                    </PrivateRoute>
                }
            />

            <Route
                path="/student"
                element={
                    <PrivateRoute allowedRole="student" >
                        <UserPage mode="student"/>
                    </PrivateRoute>
                }
            />

            <Route
                path="/simulation/:taskId"
                element={<
                    SimulationPage variant="work"/>
                }
            />

            <Route
                path="/grading/:taskId"
                element={
                    <PrivateRoute allowedRole="teacher">
                        <GradingPage/>
                    </PrivateRoute>
                }
            />

            <Route
                path="*"
                element={
                    <Navigate to={`/redirect`} replace/>
                }
            />


        </Routes>
    );
}

export default App;


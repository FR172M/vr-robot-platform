import React, {useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import { fetchMyUserAPI} from '../api/axiosInstance';

interface PrivateRouteProps {
    allowedRole: string;
    children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({allowedRole, children}) => {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await fetchMyUserAPI();
                setRole(user?.role ?? null);
            } catch (error) {
                console.error('Fehler beim Laden des Users:', error);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);



    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : !role || role !== allowedRole ? (
                <Navigate to="/redirect" replace/>
            ) : (
                children
            )}
        </>
    );
};

export default PrivateRoute;

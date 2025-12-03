import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from "@mui/material";

interface RedirectWrapperProps {
    role: string | null;
    loadingRole: boolean; // true solange fetch läuft
}

function RedirectWrapper({ role, loadingRole }: RedirectWrapperProps) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!loadingRole) {
            if (role) {
                navigate(`/${role}`, { replace: true });
            } else {
                navigate('/login', { replace: true });
            }
        }
    }, [role, loadingRole, navigate]);

    if (loadingRole) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100vw',
                    height: '100vh'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return null; // während navigate
}

export default RedirectWrapper;

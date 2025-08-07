// src/pages/LandingPage.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    Paper,
    TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (role: 'teacher' | 'student') => {
        {/* // Simulierter Dummy-Login
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
        */}

        if (role === 'teacher') {
            navigate('/teacher');
        } else {
            navigate('/student');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Paper elevation={4} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    VR Robot Platform
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 3 }}>
                    Login to continue
                </Typography>

                <Box component="form" display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="Email"
                        type="email"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleLogin('teacher')}
                    >
                        Login as Teacher
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleLogin('student')}
                    >
                        Login as Student
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LandingPage;

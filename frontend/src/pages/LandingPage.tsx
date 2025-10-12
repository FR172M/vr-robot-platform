import React, {useState} from 'react';
import {
    Box, Button, Container, Typography, Paper,
    TextField, Stack, Divider, IconButton, InputAdornment
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {VisibilityOff, Visibility} from "@mui/icons-material";

interface LandingPageProps {
    setRole: React.Dispatch<React.SetStateAction<string | null>>;
}

const LandingPage: React.FC<LandingPageProps> = ({ setRole }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (role: 'teacher' | 'student') => {
        if (role === 'teacher' && password === 'teacher') {
            sessionStorage.setItem("role", "teacher");
            setRole("teacher"); // <-- direkt im State speichern
            navigate('/teacher');
        } else if (role === 'student' && password === 'student') {
            sessionStorage.setItem("role", "student");
            setRole("student");
            navigate('/student');
        } else {
            alert('Please enter correct password');
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
                        type={showPassword ? "text" : "password"}
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Divider sx={{
                        mx: 10,
                        "&::before, &::after": { borderColor: 'text.primary' }
                    }}>
                        <Typography variant="body2">Login as</Typography>
                    </Divider>

                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() => handleLogin('teacher')}
                            sx={{ flexGrow: 1 }}
                        >
                            Teacher
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => handleLogin('student')}
                            sx={{ flexGrow: 1 }}
                        >
                            Student
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};

export default LandingPage;

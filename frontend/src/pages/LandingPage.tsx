import React, {useEffect, useRef, useState} from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Button,
    LinearProgress, Divider
} from '@mui/material';
import {Login, Visibility, VisibilityOff} from "@mui/icons-material";
import {useNavigate} from 'react-router-dom';
import {useTheme} from "@mui/material/styles";
import {loginAPI, registerAPI} from "../api/axiosInstance";

interface LandingPageProps {
    setRole: React.Dispatch<React.SetStateAction<string | null>>;
}

const LandingPage: React.FC<LandingPageProps> = ({setRole}) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [userName, setUserName] = useState('');
    const [emailSet, setEmailSet] = useState(false);
    const [pwSet, setPwSet] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [showMore, setShowMore] = useState(false);
    const [showContinue, setShowContinue] = useState(false);

    const inputMailRef = useRef<HTMLInputElement>(null);
    const inputPWRef = useRef<HTMLInputElement>(null);

    // Simple password strength
    const isStrongPassword = (pw: string) =>
        /[a-z]/.test(pw) &&        // mindestens ein Kleinbuchstabe
        /[A-Z]/.test(pw) &&        // mindestens ein Großbuchstabe
        /[\d\W]/.test(pw) &&       // Ziffer oder Sonderzeichen
        pw.length >= 6;

    // TU Mail Check
    const isTuMail = (mail: string) =>
        /^[^@\s]+@(mailbox\.)?tu-dresden\.de$/i.test(mail);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    useEffect(() => {
        if (!email) return;

        if (isTuMail(email)) {
            let namePart = email.split('@')[0];             // alles vor @
            namePart = namePart.replace(/\[\d+\]$/, '');   // [n] entfernen
            const parts = namePart.split('.').map(part => {
                // Zahlen am Ende entfernen
                part = part.replace(/\d+$/, '');
                // Unterstriche zu Leerzeichen, Bindestriche korrekt groß
                return part.split('_').map(sub =>
                    sub.split('-').map(p => capitalize(p)).join('-')
                ).join(' ');
            });
            const formatted = parts.join(' ');             // Vor- und Nachname zusammenführen
            setUserName(formatted);
            setEmailSet(true);
        }
    }, [email]);

    useEffect(() => {

        if (!isStrongPassword(password)) {
            setPasswordConfirm('')
            setPwSet(false)
        } else {
            setPwSet(true)
        }

    }, [password])

    useEffect(() => {

        let validCreds = isStrongPassword(password) && isTuMail(email);
        let validRegister = validCreds && password === passwordConfirm && userName.length > 0

        isLogin ? setShowContinue(validCreds) : setShowContinue(validRegister);

    }, [email, password, userName, passwordConfirm, isLogin]);

    const [secDelaying, setSecDelaying] = useState(false);
    const securityDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleLogin = async () => {
        if (!email || !password) return;

        setSecDelaying(true);

        try {

            await securityDelay(2000);

            const data = await loginAPI(email, password); // ✅ Axios sendet Cookie automatisch

            // Token muss nicht mehr im Frontend gespeichert werden
            setRole(data.role);
            navigate(`/${data.role}`, { replace: true });
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Login failed');
            setPassword('');
        }

        setSecDelaying(false)

    };

    const handleRegister = async () => {
        if (!userName || !email || !password || !passwordConfirm) return;

        try {
            securityDelay(2000)

            // 1️⃣ Registrierung
            await registerAPI(userName, email, password);

            // 2️⃣ Direkt Login, damit JWT gesetzt wird
            const loginData = await loginAPI(email, password);

            setRole(loginData.role); // Rolle aus Login verwenden
            navigate(`/${loginData.role}`);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Register/Login failed');
            setPassword('');
            setPasswordConfirm('');
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && showContinue) {
            isLogin ? handleLogin() : handleRegister();
        }
    };

    const handleVisibilityClick = () => {
        setShowPassword(true);

        setTimeout(() => {
            setShowPassword(false);

        }, 2000)
        inputPWRef.current?.focus();
    };

    // Auto-focus email input when card expands
    useEffect(() => {
        if (showMore) inputMailRef.current?.focus();
        else {
            setEmail('');
            setPassword('');
            setIsLogin(true);
            setEmailSet(false);
            setPwSet(false);
        }
    }, [showMore]);


    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

// Mouse handlers
    const handleMouseEnter = () => {
        // If a collapse timeout exists, cancel it
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowMore(false);
            timeoutRef.current = null;
        }, 5000);
    };

    useEffect(() => {
        document.title = `VR Robot Platform`;
    }, []);
    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.palette.background.default,
                p: 5,
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Card */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 'sm',
                    borderRadius: 2,
                    border: showMore ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.primary.main}`,
                    cursor: showMore ? 'default' : 'pointer',
                    maxHeight: showMore ? '80vh' : 0,
                    transition: 'all 800ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
                // onMouseEnter={handleMouseEnter}
                // onMouseLeave={handleMouseLeave}

            >
                {/* Header */}
                <Box
                    sx={{
                        position: 'relative',
                        width: !showMore ? '40%' : '100%',
                        top: 0,
                        left: '50%',
                        transform: showMore ? 'translateY(0%) translateX(-50%)' : 'translateY(-50%) translateX(-50%)',
                        p: 2,
                        textAlign: 'center',
                        color: theme.palette.primary.main,
                        backgroundColor: theme.palette.background.default,
                        borderBottom: showMore ? `1px solid ${theme.palette.divider}` : undefined,
                        borderTopRightRadius: 5,
                        borderTopLeftRadius: 5,
                        cursor: showMore ? 'default' : 'pointer',
                        transition: 'all 400ms ease'
                    }}
                    onClick={() => setShowMore(!showMore)}
                >
                    <Typography variant="h6" fontWeight="bolder">
                        VR Robot Platform
                    </Typography>
                </Box>

                {/* Content */}

                <>

                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            opacity: showMore ? 1 : 0,
                            visibility: showMore ? 'visible' : 'hidden',
                            transform: !showMore ? 'scaleY(0)' : 'scaleY(1)',
                            transformOrigin: 'top',
                            transition: 'all 400ms ease',
                            overflow: 'auto',

                        }}
                    >
                        <Box
                            display="flex"
                            justifyContent="center"
                            gap={1}
                            mt={1}
                        >
                            <Box
                                sx={{
                                    width: 120,
                                    textAlign: 'center',
                                    scale: 1,
                                    borderRadius: isLogin ? 0 : 5,
                                    borderBottom: '1px solid transparent', // Platz halten
                                    boxShadow: isLogin ? `inset 0 -1px 0 0 ${theme.palette.primary.main}` : `0 0 0px ${theme.palette.action.disabled}`,
                                    '&:hover': {
                                        cursor: isLogin ? undefined : 'pointer',
                                        backgroundColor: isLogin ? undefined : theme.palette.action.hover,
                                    },
                                    '&:active': {
                                        scale: isLogin ? 1 : 0.98,

                                    },
                                    transition: 'border-radius 0ms ease, all 200ms ease'

                                }}
                                onClick={() => setIsLogin(true)}

                            >
                                <Typography variant={"caption"} color={isLogin ? 'primary' : 'textSecondary'}>
                                    Login
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 120,
                                    textAlign: 'center',
                                    scale: 1,
                                    borderRadius: !isLogin ? 0 : 5,
                                    borderBottom: '1px solid transparent', // Platz halten
                                    boxShadow: !isLogin ? `inset 0 -1px 0 0 ${theme.palette.primary.main}` : `0 0 0px ${theme.palette.action.disabled}`,
                                    '&:hover': {
                                        cursor: !isLogin ? undefined : 'pointer',
                                        backgroundColor: !isLogin ? undefined : theme.palette.action.hover,
                                    },
                                    '&:active': {
                                        scale: !isLogin ? 1 : 0.98,

                                    },
                                    transition: 'border-radius 0ms ease, all 200ms ease'

                                }}
                                onClick={() => setIsLogin(false)}
                            >
                                <Typography variant={"caption"} color={!isLogin ? 'primary' : 'textSecondary'}>
                                    Register
                                </Typography>
                            </Box>

                        </Box>


                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1,
                                justifyContent: 'center',
                                mr: 3, ml: 3, mb: 1
                            }}
                        >

                            <TextField
                                inputRef={inputMailRef}
                                label="Email"
                                type="email"
                                variant="outlined"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{mb: 1}}
                                disabled={secDelaying}
                            />

                            <Box
                                sx={{
                                    maxHeight: !isLogin && emailSet ? 150 : 0,          // maximale Höhe im geöffneten Zustand
                                    opacity: !isLogin && emailSet ? 1 : 0,
                                    overflow: !isLogin && emailSet ? 'visible' : 'hidden',
                                    mb: !isLogin && emailSet ? 1 : 0,

                                    transition: 'all 400ms ease',
                                }}
                            >
                                <TextField
                                    label="Your Name"
                                    type={'text'}
                                    variant="outlined"
                                    fullWidth
                                    value={userName}
                                    disabled={!emailSet || secDelaying}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                            </Box>
                            <Box
                                sx={{
                                    maxHeight: isLogin || (!isLogin && emailSet) ? 150 : 0,
                                    opacity: isLogin || (!isLogin && emailSet) ? 1 : 0,
                                    overflow: isLogin || (!isLogin && emailSet) ? 'visible' : 'hidden',
                                    mb: isLogin || (!isLogin && emailSet) ? 1 : 0,

                                    transition: 'all 400ms ease',
                                }}
                            >
                                <TextField
                                    inputRef={inputPWRef}
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    variant="outlined"
                                    fullWidth
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleVisibilityClick} disabled={secDelaying}>
                                                    {showPassword ? <Visibility/> : <VisibilityOff/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    disabled={secDelaying}
                                />
                            </Box>
                            <Box
                                sx={{
                                    maxHeight: !isLogin && pwSet ? 150 : 0,
                                    opacity: !isLogin && pwSet ? 1 : 0,
                                    overflow: !isLogin && pwSet ? 'visible' : 'hidden',
                                    transition: 'all 400ms ease',
                                }}
                            >
                                <TextField
                                    label="Confirm Password"
                                    type={"password"}
                                    variant="outlined"
                                    fullWidth
                                    value={passwordConfirm}
                                    disabled={!pwSet || secDelaying}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                />
                            </Box>


                        </Box>
                    </Box>
                </>
                {/* Continue Button */}
                <Box
                    onClick={
                        () => showContinue ?
                            isLogin ?
                                handleLogin()
                                :
                                handleRegister()
                            :
                            ''
                    }
                    sx={{
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${theme.palette.background.default}55`,
                        color: showContinue ? theme.palette.primary.main : theme.palette.action.disabled,
                        cursor: showContinue ? 'pointer' : 'default',
                        height: 32,
                        borderBottomLeftRadius: 5,
                        borderBottomRightRadius: 5,
                        borderTop: showMore ? `1px solid ${theme.palette.divider}`: undefined,
                        transformOrigin: 'top',
                        transition: 'all 400ms ease',
                        overflow: 'hidden',
                        gap: !secDelaying ? 2 : 0,
                    }}
                >
                    {secDelaying && (<LinearProgress sx={{flexGrow:1,m:3 , borderRadius: 50}}/>)}

                    {!secDelaying && (
                        <>
                            <Button disabled={!showContinue} startIcon={<Login/>} sx={{flexGrow:1}}>


                                {isLogin ? `LOGIN` : `REGISTER`}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    )
        ;
};

export default LandingPage;

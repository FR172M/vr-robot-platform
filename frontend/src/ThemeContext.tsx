// src/ThemeContext.tsx
import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useEffect,
} from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const COLOR_MODE_KEY = 'colorMode';
type ModeType = 'light' | 'dark' | null;

const ColorModeContext = createContext({
    toggleColorMode: () => {},
    currentMode: 'light' as 'light' | 'dark',
});
export const useColorMode = () => useContext(ColorModeContext);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<ModeType>(null); // can be null = system
    const [userOverride, setUserOverride] = useState<boolean>(false);

    // Read from localStorage or fallback to system
    useEffect(() => {
        const saved = localStorage.getItem(COLOR_MODE_KEY);
        if (saved === 'light' || saved === 'dark') {
            setMode(saved);
            setUserOverride(true);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setMode(prefersDark ? 'dark' : 'light');
            setUserOverride(false);
        }
    }, []);

    // System theme change detection (only if not overridden)
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (!userOverride) {
                setMode(media.matches ? 'dark' : 'light');
            }
        };
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [userOverride]);

    // Persist only if overridden
    useEffect(() => {
        if (userOverride && mode) {
            localStorage.setItem(COLOR_MODE_KEY, mode);
        }
    }, [mode, userOverride]);

    const toggleColorMode = () => {
        setUserOverride(true);
        setMode(prev => {
            const newMode = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem(COLOR_MODE_KEY, newMode); // save immediately
            return newMode;
        });
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: mode ?? 'light',
                },
            }),
        [mode]
    );

    if (!mode) {
        return <div style={{ padding: 24 }}>Loading theme...</div>;
    }

    return (
        <ColorModeContext.Provider value={{ toggleColorMode, currentMode: mode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

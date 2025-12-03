// src/ThemeContext.tsx
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

const COLOR_MODE_KEY = 'colorMode';
type ModeType = 'light' | 'dark' | null;

interface ColorModeContextType {
    toggleColorMode: () => void;
    currentMode: 'light' | 'dark' | null;
}

const ColorModeContext = createContext<ColorModeContextType>({
    toggleColorMode: () => {},
    currentMode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<ModeType>(null);
    const [userOverride, setUserOverride] = useState(false);

    useEffect(() => {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(COLOR_MODE_KEY);
        } catch {}
        if (saved === 'light' || saved === 'dark') {
            setMode(saved);
            setUserOverride(true);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setMode(prefersDark ? 'dark' : 'light');
            setUserOverride(false);
        }
    }, []);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (!userOverride) setMode(media.matches ? 'dark' : 'light');
        };
        if (media.addEventListener) {
            media.addEventListener('change', handleChange);
        } else {
            media.addListener(handleChange);
        }
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', handleChange);
            } else {
                media.removeListener(handleChange);
            }
        };
    }, [userOverride]);

    const toggleColorMode = () => {
        setUserOverride(true);
        setMode(prev => {
            const newMode = prev === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem(COLOR_MODE_KEY, newMode);
            } catch {}
            return newMode;
        });
    };

    const lightPalette = {
        mode: 'light',
        primary: {
            main: '#00008C',     // Brillantblau
            light: '#2F57B2',    // Blau 1
            dark: '#001450',     // Dunkelblau
            contrastText: '#FFFFFF', // Weiß
        },
        secondary: {
            main: '#BC1589',     // Magenta 1
            light: '#FFB9FF',    // Heller Magenta (angenähert)
            dark: '#730A52',     // Dunkles Magenta (angepasst)
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#ffffff',  // Offwhite ähnlich Weiß
            paper: '#e7e9ed',    // Weiß
        },
        text: {
            primary: '#000000',  // Schwarz
            secondary: '#323F4B', // Grau 100 (dunkles Grau)
            disabled: '#9E9E9E',
        },
        divider: 'rgb(0,0,0,0.2)',
        success: {
            main: '#007D4B',     // Grün 1
            light: '#4CAF50',
            dark: '#004022',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FFC700',     // Gelb 1
            light: '#FFE066',
            dark: '#B38F00',
            contrastText: '#000000',
        },
        error: {
            main: '#D20F41',     // Rot 1
            light: '#E94B6B',
            dark: '#8B0A28',
            contrastText: '#FFFFFF',
        },
        info: {
            main: '#0A777F',     // Türkis 1
            light: '#4FB2B6',
            dark: '#064A4C',
            contrastText: '#FFFFFF',
        },
        action: {
            hover: 'rgba(0, 0, 140, 0.08)',       // Brillantblau leicht transparent
            selected: 'rgba(0, 0, 140, 0.16)',
            disabled: 'rgba(0,0,0,0.2)',
            disabledBackground: 'rgba(0,0,0,0.08)',
        },
    };

    const darkPalette = {
        mode: 'dark',
        primary: {
            dark: '#00008c',    // Blau 1
            light: '#97c6ff',   // Blau 2
            main: '#97c6ff',    // Brillantblau
            contrastText: '#e7e9ed',
        },
        secondary: {
            main: '#BC1589',
            light: '#FFB9FF',
            dark: '#730A52',
            contrastText: '#e7e9ed',
        },
        background: {
            default: '#323F4B', // Dunkelblau (dunkel)
            paper: '#566371',   // Türkis 1 als Kartenhintergrund
        },
        text: {
            primary: '#e7e9ed',
            secondary: '#d0d5dc',
            disabled: '#a5aeb8',
        },
        divider: 'rgb(255,255,255,0.1)',
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#007D4B',
            contrastText: '#001450',
        },
        warning: {
            main: '#FFC700',
            light: '#FFEB3B',
            dark: '#B38F00',
            contrastText: '#001450',
        },
        error: {
            main: '#D20F41',
            light: '#E94B6B',
            dark: '#8B0A28',
            contrastText: '#001450',
        },
        info: {
            main: '#0A777F',
            light: '#4FB2B6',
            dark: '#064A4C',
            contrastText: '#F8F9FA',
        },
        action: {
            hover: 'rgba(47, 87, 178, 0.16)',
            selected: 'rgba(44, 148, 204, 0.24)',
            disabled: 'rgba(255, 255, 255, 0.3)',
            disabledBackground: 'rgba(255, 255, 255, 0.12)',
        },
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: mode === 'light' ? lightPalette : darkPalette,
                typography: {
                    fontFamily: `'Libre Franklin', Arial, Helvetica, sans-serif`,
                },
            } as any ),
        [mode]
    );

    if (!mode) {
        return <Box sx={{ width: '100vw', textAlign: 'center', mt: 5 }}>Loading theme...</Box>;
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

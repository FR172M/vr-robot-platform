// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {AxiosErrorProvider} from "./api/ErrorHandler";
import {SnackbarProvider} from "notistack";
import {CustomThemeProvider} from "./ThemeContext2";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
                <AxiosErrorProvider>
                    <CustomThemeProvider>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <App/>
                        </LocalizationProvider>
                    </CustomThemeProvider>
                </AxiosErrorProvider>
            </SnackbarProvider>
        </BrowserRouter>
    </React.StrictMode>
);

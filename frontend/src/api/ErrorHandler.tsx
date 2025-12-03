// src/api/ErrorHandler.tsx
import React, {createContext, useContext, useEffect} from 'react';
import {useSnackbar} from 'notistack';
import api from './axiosInstance';

const AxiosErrorContext = createContext({});

export const AxiosErrorProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            res => res,
            err => {
                if (err.config?.skipErrorHandler) return Promise.reject(err); // ignorieren

                const msg = err.response?.data?.message || err.message || 'Unexpected backend error';
                enqueueSnackbar(msg, {variant: 'error'});
                return Promise.reject(err);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, [enqueueSnackbar]);

    return <AxiosErrorContext.Provider value={{}}>{children}</AxiosErrorContext.Provider>;
};

export const useAxiosError = () => useContext(AxiosErrorContext);

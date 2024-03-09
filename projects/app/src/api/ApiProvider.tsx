import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosProvider, isHttpError, useAxios } from '@untype/rpc-react';
import Axios, { AxiosRequestConfig } from 'axios';
import { FC, ReactNode, useInsertionEffect, useState } from 'react';
import { API_URL } from '../config';
import { useInvalidate } from './rpc';

const config: AxiosRequestConfig = {
    baseURL: API_URL,
};

export const ApiProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [client] = useState(() => {
        return new QueryClient({
            defaultOptions: {
                mutations: { retry: false },
                queries: { retry: false },
            },
        });
    });

    return (
        <QueryClientProvider client={client}>
            <AxiosProvider config={config}>
                <AxiosInterceptor children={children} />
            </AxiosProvider>
        </QueryClientProvider>
    );
};

const AxiosInterceptor: FC<{ children: ReactNode }> = ({ children }) => {
    const { axios } = useAxios();
    const invalidate = useInvalidate();

    useInsertionEffect(() => {
        const requestInterceptorId = axios.interceptors.request.use(async (config) => {
            config.headers.Authorization = await AsyncStorage.getItem('AUTH/ACCESS_TOKEN');
            return config;
        });

        const responseInterceptorId = axios.interceptors.response.use(
            async (response) => {
                const token = response.headers.authorization;
                if (token) {
                    await AsyncStorage.setItem('AUTH/ACCESS_TOKEN', token);
                }

                return response;
            },
            async (error) => {
                if (Axios.isCancel(error)) {
                    throw error;
                }

                if (isHttpError(error, 401)) {
                    await AsyncStorage.removeItem('AUTH/ACCESS_TOKEN');
                    // await invalidate(['user/profile']);
                } else {
                    const message = error.message ?? 'Error';
                    const description = error?.response?.data?.message ?? error.message ?? 'Error';
                }

                throw error;
            },
        );

        return () => {
            axios.interceptors.response.eject(responseInterceptorId);
            axios.interceptors.request.eject(requestInterceptorId);
        };
    }, []);

    return children;
};

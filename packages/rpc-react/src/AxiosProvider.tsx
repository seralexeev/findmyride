import { assert } from '@untype/toolbox';
import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { FC, ReactNode, createContext, useContext, useMemo } from 'react';

type ContextType = {
    axios: AxiosInstance;
};

const Context = createContext<ContextType | null>(null);

export const useAxios = () => {
    const context = useContext(Context);
    return assert.notnull(context, 'AxiosProvider not found');
};

export const AxiosProvider: FC<{ children: ReactNode; config?: AxiosRequestConfig }> = ({ children, config }) => {
    const context = useMemo(() => {
        return {
            axios: Axios.create(config),
        };
    }, [config]);

    return <Context.Provider value={context} children={children} />;
};

export const isHttpError = (error: unknown, status?: number): error is AxiosError => {
    if (!error) {
        return false;
    }

    if (!Axios.isAxiosError(error)) {
        return false;
    }

    return !status || error.response?.status === status;
};

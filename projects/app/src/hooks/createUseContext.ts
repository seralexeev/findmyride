import { createContext, useContext } from 'react';

export const createUseContext = <T>(name: string) => {
    const Context = createContext<T | null>(null);

    const useRequiredContext = () => {
        const context = useContext(Context);
        if (!context) {
            throw new Error(`Context provider not found: ${name}`);
        }

        return context;
    };

    return [useRequiredContext, Context.Provider, Context] as const;
};

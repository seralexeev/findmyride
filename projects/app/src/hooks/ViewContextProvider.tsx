import React, { createContext, FC, ReactNode, useContext, useMemo } from 'react';

const Context = createContext<Record<string, true>>({});

export const useViewContext = (context: string) => context in useContext(Context);

export const ViewContextProvider: FC<{ children: ReactNode; context: string }> = ({ children, context }) => {
    const parentContext = useContext(Context);
    const value = useMemo(() => ({ ...parentContext, [context]: true as const }), [context, parentContext]);

    return <Context.Provider value={value} children={children} />;
};

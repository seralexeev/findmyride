import React, { FC, Fragment, ReactNode, useState } from 'react';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';

export const [useRemountApp, Provider] = createUseContext<() => void>('RefreshTreeProvider');

export const RemountAppProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [epoch, setEpoch] = useState(0);
    const context = useEvent(() => setEpoch((epoch) => epoch + 1));

    return (
        <Provider value={context}>
            <Fragment key={epoch} children={children} />
        </Provider>
    );
};

import { RpcOutput } from '@findmyride/api';
import { FC, ReactNode } from 'react';
import { useRpc } from '../api/rpc';
import { createUseContext } from '../hooks/createUseContext';
import { ui } from '../ui';

export const [useConfig, Provider] = createUseContext<RpcOutput<'home/config'>>('ConfigProvider');

export const ConfigProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const query = useRpc('home/config').useQuery();
    if (query.status !== 'success') {
        return <ui.FetchFallback query={query} />;
    }

    return <Provider value={query.data} children={children} />;
};

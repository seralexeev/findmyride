import deepmerge from 'deepmerge';
import React, { FC, ReactNode, useMemo } from 'react';
import { createUseContext } from '../hooks/createUseContext';
import { Theme } from './theme';

export const [useTheme, Provider] = createUseContext<Theme>('ThemeProvider');

export const ThemeProvider: FC<{ config: Theme; children: ReactNode }> = ({ children, config }) => {
    const finalConfig = useMemo(() => {
        const finalConfig: Theme = {
            ...config,
            font: {
                ...config.font,
                variants: Object.entries(config.font.variants).reduce((acc, [key, value]) => {
                    acc[key] = deepmerge(config.font.default, value);
                    return acc;
                }, {} as any),
            },
        };

        return finalConfig;
    }, [config]);

    return <Provider value={finalConfig} children={children} />;
};

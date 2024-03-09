import React, { FC } from 'react';
import * as rn from 'react-native';
import { useLoadCallback } from '../../hooks/useLoadingCallback';
import { useTheme } from '../ThemeProvider';

export type RefreshControlProps = {
    onRefresh: () => void;
};

export const RefreshControl: FC<RefreshControlProps> = ({ onRefresh }) => {
    const [onRefreshAction, refreshing] = useLoadCallback(onRefresh);
    const { colors } = useTheme();

    return <rn.RefreshControl onRefresh={onRefreshAction} refreshing={refreshing} tintColor={colors.light.foreground} />;
};

// Custom refresh control doesn't work on Android
export const useRefreshControlProps = (refresh: () => void): rn.RefreshControlProps => {
    const { colors } = useTheme();
    const [onRefresh, refreshing] = useLoadCallback(refresh);

    return {
        refreshing,
        onRefresh,
        tintColor: colors.light.foreground,
    };
};

export const useRefreshControl = (refresh: () => void) => {
    const { colors } = useTheme();
    const [onRefresh, refreshing] = useLoadCallback(refresh);
    const item = <rn.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.light.foreground} />;

    const refreshControl = item as typeof item & {
        refreshing: boolean;
    };

    refreshControl.refreshing = refreshing;

    return refreshControl;
};

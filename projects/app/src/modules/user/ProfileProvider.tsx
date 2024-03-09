import { RpcOutput } from '@findmyride/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransitionPresets } from '@react-navigation/stack';
import { isHttpError } from '@untype/rpc-react';
import React, { FC, ReactNode, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRpc } from '../../api/rpc';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';
import { ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { AuthScreen } from '../auth/AuthScreen';
import { FullAuthScreen } from '../auth/FullAuthScreen';

export const [useProfile, Provider] = createUseContext<{
    profile: RpcOutput<'user/profile'>;
    logout: (options?: { deleteAccount?: boolean }) => Promise<any>;
    refetch: () => Promise<any>;
    requireRegistration: <P extends any[], R>(callback: (...args: P) => R) => (...args: P) => Promise<R>;
}>('ProfileProvider');

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const query = useRpc('user/profile').useQuery();
    const [logoutMutation] = useRpc('auth/logout').useMutation();
    const { showScreen } = useScreen();

    const logout = useEvent(async (options?: { deleteAccount?: boolean }) => {
        try {
            await logoutMutation(options);
        } finally {
            await AsyncStorage.removeItem('AUTH/ACCESS_TOKEN');
            await query.refetch();
        }
    });

    const requireRegistration = <P extends any[], R>(callback: (...args: P) => R) => {
        return (...args: P) => {
            return new Promise<R>((resolve) => {
                if (query.data && !query.data.isAnonymous) {
                    return resolve(callback(...args));
                }

                showScreen({
                    children: ({ goBack }) => (
                        <AuthScreen
                            onSuccess={() => {
                                goBack();
                                resolve(callback(...args));
                            }}
                        />
                    ),
                    options: Platform.select({
                        ios: TransitionPresets.ModalPresentationIOS,
                        android: TransitionPresets.RevealFromBottomAndroid,
                    }),
                });
            });
        };
    };

    const context = useMemo(
        () => ({ profile: query.data as RpcOutput<'user/profile'>, refetch: query.refetch, logout, requireRegistration }),
        [query.data],
    );

    if (isHttpError(query.error, 401)) {
        return <FullAuthScreen />;
    }

    if (query.status !== 'success') {
        return <ui.FetchFallback query={query} />;
    }

    return <Provider value={context} children={children} />;
};

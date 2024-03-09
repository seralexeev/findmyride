import { RpcEndpoint } from '@findmyride/api';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useLinkTo } from '@react-navigation/native';
import React, { FC, ReactNode, useEffect, useMemo } from 'react';
import { PermissionStatus } from 'react-native-permissions';
import { useInvalidate, useRpc } from '../../api/rpc';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';
import { useBottomSheet } from '../../ui/BottomSheetProvider';
import { useNotificationStatus } from './NotificationStatusProvider';
import { RequestNotification } from './RequestNotification';

export const [useNotification, Provider] = createUseContext<{
    requestPermissionPopup: (force?: boolean) => Promise<PermissionStatus>;
}>('NotificationProvider');

export const NotificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [mutateAsync] = useRpc('auth/fcm_token').useMutation();
    const showBottomSheet = useBottomSheet();
    const { permissionStatus } = useNotificationStatus();
    const linkTo = useLinkTo();
    const invalidate = useInvalidate();

    useEffect(() => {
        const handlePassiveAction = (actions: unknown[]) => {
            const invalidateQueries: RpcEndpoint[] = [];
            for (const action of actions) {
                // if (isAction<PassiveActions, '@app/REFRESH_QUERIES'>('@app/REFRESH_QUERIES', action)) {
                //     invalidateQueries.push(...action.payload.queries);
                // }
            }

            if (invalidateQueries.length) {
                void invalidate(invalidateQueries);
            }
        };

        const handleAction = (data?: Record<string, string>) => {
            if (typeof data?.action !== 'string') {
                return;
            }

            const actionRaw = JSON.parse(data.action);
            // const actions: UnknownAction[] = Array.isArray(actionRaw) ? actionRaw : [actionRaw];

            // for (const action of actions) {
            //     if (isAction<NavigationAction, '@app/NAVIGATE'>('@app/NAVIGATE', action)) {
            //         linkTo(action.payload.url);
            //     }
            // }
        };

        const onMessage = async (message: FirebaseMessagingTypes.RemoteMessage | null, foreground = false) => {
            if (!message?.notification) {
                return;
            }

            let channelId: string | undefined;
            try {
                channelId = await notifee.createChannel({
                    id: 'important',
                    name: 'Important Notifications',
                    importance: AndroidImportance.HIGH,
                });
            } catch (error) {
                // ignored
            }

            const action = message.data?.action ? JSON.parse(message.data.action as any) : null;
            const actions: unknown[] = Array.isArray(action) ? action : [action];

            handlePassiveAction(actions);

            if (foreground) {
                return notifee.displayNotification({
                    title: message.notification.title,
                    body: message.notification.body,
                    data: message.data,
                    android: {
                        channelId,
                        importance: AndroidImportance.HIGH,
                    },
                });
            } else {
                // handleAction(message.data);
            }
        };

        const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                // handleAction(detail.notification?.data);
            }
        });

        const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(onMessage);
        void messaging().getInitialNotification().then(onMessage);
        const unsubscribeOnMessage = messaging().onMessage((m) => onMessage(m, true));

        return () => {
            unsubscribeNotifee();
            unsubscribeOnMessage();
            unsubscribeOnNotificationOpenedApp();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (permissionStatus) {
            void messaging()
                .getToken()
                .then((fcmToken) => mutateAsync({ fcmToken, status: permissionStatus }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionStatus]);

    const requestPermissionPopup = useEvent(async (force?: boolean) => {
        const requested = Boolean(await AsyncStorage.getItem('NOTIFICATIONS/REQUESTED'));
        if (!requested) {
            await AsyncStorage.setItem('NOTIFICATIONS/REQUESTED', 'true');
        }

        return new Promise<PermissionStatus>((res, rej) => {
            if (permissionStatus === 'granted') {
                return res(permissionStatus);
            }

            if (!requested || force) {
                showBottomSheet({
                    position: 310,
                    onClose: () => rej(permissionStatus),
                    children: ({ close }) => (
                        <RequestNotification
                            onClose={(status) => {
                                close();
                                rej(status);
                            }}
                        />
                    ),
                });
            }
        });
    });

    const value = useMemo(() => ({ requestPermissionPopup }), [requestPermissionPopup]);

    return <Provider value={value}>{children}</Provider>;
};

import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { NotificationsResponse, PermissionStatus, checkNotifications, requestNotifications } from 'react-native-permissions';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';

export const [useNotificationStatus, Provider] = createUseContext<{
    permissionStatus: PermissionStatus;
    requestPermission: () => Promise<NotificationsResponse>;
}>('NotificationStatusProvider');

export const NotificationStatusProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('denied');

    const updatePermissionStatus = useEvent(async () => {
        const status = await checkNotifications();
        setPermissionStatus(status.status);

        return status;
    });

    const requestPermission = useEvent(async () => {
        await requestNotifications(['alert', 'sound', 'badge']);
        return updatePermissionStatus();
    });

    useEffect(() => {
        void updatePermissionStatus();

        const { remove } = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                return updatePermissionStatus();
            }
        });

        return remove;
    }, []);

    const value = useMemo(() => ({ permissionStatus, requestPermission }), [permissionStatus]);

    return <Provider value={value} children={children} />;
};

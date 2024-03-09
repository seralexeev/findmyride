import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Permission, PermissionStatus, check } from 'react-native-permissions';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';

export const locationPermission: Permission =
    Platform.select({
        ios: 'ios.permission.LOCATION_WHEN_IN_USE',
        android: 'android.permission.ACCESS_FINE_LOCATION',
    }) ?? 'ios.permission.LOCATION_WHEN_IN_USE';

export const [useGeoLocationStatus, Provider] = createUseContext<{
    permissionStatus: PermissionStatus | null;
    updatePermissionStatus: () => Promise<PermissionStatus>;
}>('GeoLocationStatusProvider');

export const GeoLocationStatusProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);

    const updatePermissionStatus = useEvent(async () => {
        const status = await check(locationPermission);
        setPermissionStatus(status);

        return status;
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

    const value = useMemo(() => ({ updatePermissionStatus, permissionStatus }), [permissionStatus]);

    return <Provider value={value} children={children} />;
};

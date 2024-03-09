import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PermissionStatus } from 'react-native-permissions';
import { useRpc } from '../../api/rpc';
import { createUseContext } from '../../hooks/createUseContext';
import { useEvent } from '../../hooks/useEvent';
import { useBottomSheet } from '../../ui/BottomSheetProvider';
import { useGeoLocationStatus } from '../geo/GeoLocationStatusProvider';
import { RequestLocation } from './RequestLocation';

export const [useGeoLocation, Provider] = createUseContext<{
    permissionStatus: PermissionStatus | null;
    requestPermission: (force?: boolean) => Promise<GeoPosition>;
    getCurrentLocation: () => Promise<GeoPosition>;
    location: GeoPosition | null;
}>('GeoLocation');

export const GeoLocationProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const showBottomSheet = useBottomSheet();
    const { permissionStatus, updatePermissionStatus } = useGeoLocationStatus();
    const [location, setLocation] = useState<GeoPosition | null>(null);
    const [updateDeviceLocation] = useRpc('user/update_location').useMutation();

    const getCurrentLocation = useEvent(() => {
        return new Promise<GeoPosition>((res, rej) => {
            Geolocation.getCurrentPosition(
                (x) => {
                    void updateDeviceLocation({
                        location: {
                            type: 'Point',
                            coordinates: [x.coords.longitude, x.coords.latitude],
                        },
                    });

                    res(x);
                    setLocation(x);
                },
                (e) => {
                    rej(e);
                    setLocation(null);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
        });
    });

    useEffect(() => {
        if (permissionStatus !== 'granted') {
            return;
        }

        let isActive = true;
        const updateLocation = () => {
            return getCurrentLocation().finally(() => {
                setTimeout(() => {
                    if (isActive) {
                        return updateLocation();
                    }
                }, 60 * 1000);
            });
        };

        void updateLocation();

        return () => {
            isActive = false;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionStatus]);

    const getCachedLocation = useEvent(async () => {
        return location ?? getCurrentLocation();
    });

    useEffect(() => {
        if (permissionStatus === 'granted') {
            void getCurrentLocation();
        } else {
            setLocation(null);
        }
    }, [getCurrentLocation, permissionStatus]);

    const requestPermission = useEvent(async (force?: boolean) => {
        const requested = Boolean(await AsyncStorage.getItem('LOCATION/REQUESTED'));
        if (!requested) {
            await AsyncStorage.setItem('LOCATION/REQUESTED', 'true');
        }

        return new Promise<GeoPosition>((res, rej) => {
            if (permissionStatus === 'granted') {
                getCachedLocation().then(res).catch(rej);
            } else if (force || !requested) {
                showBottomSheet({
                    position: 310,
                    onClose: () => {
                        return updatePermissionStatus().then((status) => {
                            if (status === 'granted') {
                                getCachedLocation().then(res).catch(rej);
                            } else {
                                rej();
                            }
                        });
                    },
                    children: ({ close }) => (
                        <RequestLocation
                            onChangeStatus={(status) => {
                                status === 'granted' ? getCachedLocation().then(res).catch(rej) : rej();
                                close();
                            }}
                        />
                    ),
                });
            } else {
                rej();
            }
        });
    });

    const value = useMemo(
        () => ({ getCurrentLocation, requestPermission, permissionStatus, location }),
        [getCurrentLocation, location, permissionStatus, requestPermission],
    );

    return <Provider value={value} children={children} />;
};

import { RpcOutput } from '@findmyride/api';
import MapboxGL, { MapView } from '@rnmapbox/maps';
import { CameraProps } from '@rnmapbox/maps/lib/typescript/src/components/Camera';
import React, { ComponentProps, FC, ReactNode, forwardRef, useEffect, useRef, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfig } from '../../config/ConfigProvider';
import { icons, ui } from '../../ui';
import { withStyler } from '../../ui/styler';
import { viewStyler } from '../../ui/styler/viewStyler';
import { UserAvatar } from '../user/UserAvatar';
import { useOpenUserProfile } from '../user/services';
import { useGeoLocation } from './GeoLocationProvider';

export type InteractiveMapProps = ComponentProps<typeof MapView> & {
    style?: ViewStyle;
    aux?: ReactNode;
    cameraProps?: CameraProps | null;
    askPermission?: boolean;
    askPermissionForce?: boolean;
    toolbarBottom: number;
};

let initialized = false;
const InteractiveMapImpl = forwardRef<MapboxGL.MapView, InteractiveMapProps>(function InteractiveMapImpl(
    { style, children, aux, cameraProps, askPermission, askPermissionForce, toolbarBottom, ...props },
    ref,
) {
    const config = useConfig();
    const { bottom } = useSafeAreaInsets();
    const { requestPermission, permissionStatus, location } = useGeoLocation();
    const camera = useRef<MapboxGL.Camera>(null);
    const map = useRef<MapboxGL.MapView | null>(null);
    const [initialUserLocation] = useState(location);

    if (!initialized) {
        MapboxGL.setAccessToken(config.mapbox.publicKey);
        MapboxGL.setTelemetryEnabled(false);
        initialized = true;
    }

    if (permissionStatus === 'granted' && initialUserLocation) {
        cameraProps ??= {
            zoomLevel: 12,
            animationDuration: 0,
            centerCoordinate: [initialUserLocation.coords.longitude, initialUserLocation.coords.latitude],
        };
    }

    useEffect(() => {
        if (askPermission || askPermissionForce) {
            void requestPermission(Boolean(askPermissionForce));
        }
    }, [askPermission, askPermissionForce]);

    const bottomInset = toolbarBottom ? toolbarBottom * 8 + 8 : Math.max(bottom, 8);

    return (
        <ui.Box style={style} overflowHidden>
            <MapboxGL.MapView
                ref={(current) => {
                    map.current = current;
                    return ref;
                }}
                style={StyleSheet.absoluteFillObject}
                attributionEnabled={false}
                logoEnabled={false}
                styleURL='mapbox://styles/mapbox/light-v10'
                {...props}
            >
                <MapboxGL.UserLocation />
                {children}
                <MapboxGL.Camera ref={camera} {...cameraProps} />
            </MapboxGL.MapView>
            <ui.Box position='absolute' bottom={`${bottomInset}px`} right={`${8}px`}>
                <ui.Stack flexInside={false} spacing>
                    <ui.Button
                        borderVariant='round'
                        color='light'
                        size='large'
                        StartIcon={icons.Location}
                        fillIcon={false}
                        shadow
                        onPress={async () => {
                            const position = await requestPermission(true);
                            const zoom = await map.current?.getZoom();

                            camera.current?.setCamera({
                                centerCoordinate: [position.coords.longitude, position.coords.latitude],
                                animationMode: 'flyTo',
                                animationDuration: 1000,
                                zoomLevel: Math.max(zoom ?? 14, 14),
                            });
                        }}
                    />
                </ui.Stack>
            </ui.Box>
            {aux}
        </ui.Box>
    );
});

export const UserMarker: FC<{ user: RpcOutput<'social/get_user_info'>; navigate: boolean }> = ({ user, navigate }) => {
    const openProfile = useOpenUserProfile();
    if (!user.location) {
        return null;
    }

    return (
        <MapboxGL.MarkerView coordinate={user.location.location.coordinates} id='user' anchor={{ x: 0.5, y: 1 }}>
            <ui.Transition inAnimation='fadeInDown' visible delay={500} duration={100} width={64}>
                <ui.Box position='relative' onPress={() => navigate && openProfile(user.id)}>
                    <icons.MarkerBig width={64} height={64} fill='#000' />
                    <ui.Box position='absolute' top={1} left={2}>
                        <UserAvatar user={user} size={32} />
                    </ui.Box>
                </ui.Box>
            </ui.Transition>
        </MapboxGL.MarkerView>
    );
};

export const InteractiveMap = withStyler(viewStyler)(InteractiveMapImpl);

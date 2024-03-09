import React, { FC } from 'react';
import { Linking } from 'react-native';
import { PermissionStatus, request } from 'react-native-permissions';
import { ui } from '../../ui';
import { locationPermission, useGeoLocationStatus } from '../geo/GeoLocationStatusProvider';

export const RequestLocation: FC<{ onChangeStatus?: (status: PermissionStatus | null) => void }> = ({ onChangeStatus }) => {
    const { permissionStatus, updatePermissionStatus } = useGeoLocationStatus();
    const onClose = () => onChangeStatus?.(permissionStatus);

    const getContent = () => {
        switch (permissionStatus) {
            case 'denied':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='You need allow us to access your location' />
                            <ui.Text
                                variant='caption'
                                center
                                children='Press the Allow button and allow again on the system dialog.'
                            />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button
                                onPress={() => {
                                    return request(locationPermission).then(() => {
                                        return updatePermissionStatus().then(onChangeStatus);
                                    });
                                }}
                                children='Allow'
                            />
                            <ui.Button color='light' onPress={onClose} children='Cancel' />
                        </ui.Stack>
                    </ui.Box>
                );

            case 'granted':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='The access to your location is granted!' />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button color='light' onPress={onClose} children='Close' />
                        </ui.Stack>
                    </ui.Box>
                );

            case 'unavailable':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children={`You haven't allowed us to access your location`} />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button color='light' onPress={onClose} children='Close' />
                        </ui.Stack>
                    </ui.Box>
                );

            default:
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text
                                variant='caption'
                                center
                                children='The access to your location is disabled for this App.'
                            />
                            <ui.Text
                                variant='caption'
                                center
                                children='You need to enable it manually using the App Settings'
                            />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button onPress={Linking.openSettings} children='Open Settings' />
                            <ui.Button color='light' onPress={onClose} children='Cancel' />
                        </ui.Stack>
                    </ui.Box>
                );
        }
    };

    return (
        <ui.Box padding={2} flex>
            <ui.Box borderBottomWidth borderColor flexCenter>
                <ui.Text variant='title2' center children='Allow Location Access' paddingBottom={2} />
            </ui.Box>
            <ui.Box paddingVertical flex>
                {getContent()}
            </ui.Box>
        </ui.Box>
    );
};

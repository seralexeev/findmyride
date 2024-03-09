import React, { FC } from 'react';
import { Linking } from 'react-native';
import { PermissionStatus } from 'react-native-permissions';
import { ui } from '../../ui';
import { useNotificationStatus } from './NotificationStatusProvider';

type RequestNotificationProps = {
    onClose: (status: PermissionStatus) => void;
};

export const RequestNotification: FC<RequestNotificationProps> = ({ onClose }) => {
    const { permissionStatus, requestPermission } = useNotificationStatus();

    const getContent = () => {
        switch (permissionStatus) {
            case 'denied':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='Push Notifications' />
                            <ui.Text
                                variant='caption'
                                center
                                children='Press the Allow button and allow again on the system dialog.'
                            />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button
                                onPress={() => requestPermission().then(({ status }) => onClose(status))}
                                children='Allow'
                            />
                            <ui.Button color='light' onPress={() => onClose(permissionStatus)} children='Cancel' />
                        </ui.Stack>
                    </ui.Box>
                );

            case 'granted':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='Push Notifications are now enabled!' />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button color='light' onPress={() => onClose(permissionStatus)} children='Close' />
                        </ui.Stack>
                    </ui.Box>
                );

            case 'unavailable':
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='Push Notifications are unavailable for the App.' />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button color='light' onPress={() => onClose(permissionStatus)} children='Close' />
                        </ui.Stack>
                    </ui.Box>
                );

            default:
                return (
                    <ui.Box flex>
                        <ui.Box flex flexCenter paddingBottom>
                            <ui.Text variant='caption' center children='Push Notifications are disabled for this App.' />
                            <ui.Text
                                variant='caption'
                                center
                                children='You need to enable them manually using the App Settings'
                            />
                        </ui.Box>
                        <ui.Stack spacing={2}>
                            <ui.Button onPress={Linking.openSettings} children='Open Settings' />
                            <ui.Button color='light' onPress={() => onClose(permissionStatus)} children='Cancel' />
                        </ui.Stack>
                    </ui.Box>
                );
        }
    };

    return (
        <ui.Box padding={2} flex>
            <ui.Box borderBottomWidth borderColor flexCenter>
                <ui.Text variant='title2' center children='Allow Push Notifications' paddingBottom={2} />
            </ui.Box>
            <ui.Box paddingVertical flex>
                {getContent()}
            </ui.Box>
        </ui.Box>
    );
};

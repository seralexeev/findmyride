import { routes } from '@findmyride/api';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import React, { FC, memo, useEffect } from 'react';
import { Platform } from 'react-native';
import { ChatRoomScreen } from '../chat/ChatRoom';
import { TabNavigator } from '../home/TabNavigator';
import { useNotification } from '../notifications/NotificationProvider';
import { SelectRideSourceScreen } from '../rides/create/SelectRideSourceScreen';
import { LazyRideImageScreen } from '../rides/view/RideImageScreen';
import { RideProfileScreen } from '../rides/view/RideProfileScreen';
import { UserProfileRouteScreen } from '../user/UserProfileScreen';

const Stack = createStackNavigator();
Stack.Navigator.defaultProps = {
    screenOptions: {
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: false,
    },
};

export const RootNavigator: FC = memo(function RootNavigator() {
    const { requestPermissionPopup } = useNotification();

    useEffect(() => {
        void requestPermissionPopup();
    }, []);

    return (
        <Stack.Navigator>
            <Stack.Screen name='TabNavigator' component={TabNavigator} />
            <Stack.Screen
                name={routes.createRide()}
                component={SelectRideSourceScreen}
                options={Platform.select({
                    ios: TransitionPresets.ModalPresentationIOS,
                    android: TransitionPresets.RevealFromBottomAndroid,
                })}
            />
            <Stack.Screen name={routes.userProfile()} component={UserProfileRouteScreen} />
            <Stack.Screen name={routes.ride()} component={RideProfileScreen} />
            <Stack.Screen name={routes.photos()} component={LazyRideImageScreen} />
            <Stack.Screen name={routes.chat()} component={ChatRoomScreen} />
        </Stack.Navigator>
    );
});

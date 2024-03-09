import { NavigationContainer } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from './api/ApiProvider';
import { ConfigProvider } from './config/ConfigProvider';
import { ViewContextProvider } from './hooks/ViewContextProvider';
import { analytics } from './modules/analytics';
import { GeoLocationStatusProvider } from './modules/geo/GeoLocationStatusProvider';
import { GeoLocationProvider } from './modules/map/GeoLocationProvider';
import { RemountAppProvider } from './modules/navigation/RemountAppProvider';
import { RootNavigator } from './modules/navigation/RootNavigator';
import { linking } from './modules/navigation/routes';
import { NotificationProvider } from './modules/notifications/NotificationProvider';
import { NotificationStatusProvider } from './modules/notifications/NotificationStatusProvider';
import { ProfileProvider } from './modules/user/ProfileProvider';
import { ui } from './ui';
import { BottomSheetProvider } from './ui/BottomSheetProvider';
import { ScreenProvider, ScreenProviderHost } from './ui/ScreenProvider';
import { ThemeProvider } from './ui/ThemeProvider';
import { theme } from './ui/theme';

export const App = memo(() => {
    useEffect(() => {
        const { remove } = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                return analytics.logAppOpen();
            }
        });

        return remove;
    }, []);

    return (
        <RemountAppProvider>
            <StatusBar barStyle='dark-content' />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ViewContextProvider context='app'>
                    <ThemeProvider config={theme}>
                        <ui.Box backgroundColor='#fff' flex>
                            <SafeAreaProvider>
                                <NavigationContainer linking={linking}>
                                    <NotificationStatusProvider>
                                        <ApiProvider>
                                            <BottomSheetProvider>
                                                <NotificationProvider>
                                                    <GeoLocationStatusProvider>
                                                        <GeoLocationProvider>
                                                            <ScreenProvider>
                                                                <ConfigProvider>
                                                                    <ProfileProvider>
                                                                        <ScreenProviderHost>
                                                                            <RootNavigator />
                                                                        </ScreenProviderHost>
                                                                    </ProfileProvider>
                                                                </ConfigProvider>
                                                            </ScreenProvider>
                                                        </GeoLocationProvider>
                                                    </GeoLocationStatusProvider>
                                                </NotificationProvider>
                                            </BottomSheetProvider>
                                        </ApiProvider>
                                    </NotificationStatusProvider>
                                </NavigationContainer>
                            </SafeAreaProvider>
                        </ui.Box>
                    </ThemeProvider>
                </ViewContextProvider>
            </GestureHandlerRootView>
        </RemountAppProvider>
    );
});

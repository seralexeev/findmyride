import { routes } from '@findmyride/api';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { FC, memo } from 'react';
import { ViewContextProvider } from '../../hooks/ViewContextProvider';
import { CurrentProfileScreen } from '../user/UserProfileScreen';
import { HomeScreen } from './HomeScreen';
import { TabBar } from './TabBar';

const HomeTabNav = createBottomTabNavigator();
HomeTabNav.Navigator.defaultProps = {
    screenOptions: {
        headerShown: false,
    },
};

export const TabNavigator: FC = memo(() => {
    return (
        <ViewContextProvider context='TabNavigator'>
            <HomeTabNav.Navigator tabBar={(props) => <TabBar {...props} />}>
                <HomeTabNav.Screen name={routes.home()} component={HomeScreen} />
                {/* <HomeTabNav.Screen name={routes.feed()} component={FeedScreen} />
                 */}
                <HomeTabNav.Screen name={routes.profile()} component={CurrentProfileScreen} />
            </HomeTabNav.Navigator>
        </ViewContextProvider>
    );
});

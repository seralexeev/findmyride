import { routes } from '@findmyride/api';
import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
    prefixes: ['https://findmyride.app', 'findmyride://'],
    config: {
        screens: {
            Root: {
                initialRouteName: 'TabNavigator' as any,
                screens: {
                    [routes.createRide()]: routes.createRide(),
                    [routes.userProfile()]: routes.userProfile(),
                    [routes.ride()]: routes.ride(),
                    [routes.photos()]: routes.photos(),
                    [routes.chat()]: routes.chat(),
                    [routes.home()]: routes.home(),
                    [routes.feed()]: routes.feed(),
                    [routes.profile()]: routes.profile(),
                },
            },
        },
    },
};

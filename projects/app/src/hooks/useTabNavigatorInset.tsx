import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { useViewContext } from './ViewContextProvider';

export const useTabNavigatorInset = (add: number = 0) => {
    const inTabNavigator = useViewContext('TabNavigator');
    const { bottom } = useSafeAreaInsets();
    const { unit } = useTheme();

    const paddingBottom = (inTabNavigator ? bottom + 96 : bottom) + add;

    return {
        paddingBottom: `${paddingBottom}px`,
        maxPaddingBottom: (value: number) => `${Math.max(paddingBottom, value * unit)}px`,
    };
};

import { routes } from '@findmyride/api';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { FC, ReactNode, memo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { icons, ui } from '../../ui';
import { useTheme } from '../../ui/ThemeProvider';
import { useProfile } from '../user/ProfileProvider';
import { UserAvatar } from '../user/UserAvatar';

export const TabBar: FC<BottomTabBarProps> = memo(({ state, navigation }) => {
    const { profile, requireRegistration } = useProfile();
    const isActive = (routeName: string) => routeName === state.routes[state.index]?.name;
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();

    return (
        <ui.Box row justifyContent='space-around' position='absolute' left={0} bottom={0} right={0} shadow>
            <TabItem
                title='Explore'
                icon={({ color }) => <icons.Home width={30} height={30} fill={color} />}
                isActive={isActive(routes.home())}
                onPress={() => navigation.navigate(routes.home())}
            />

            <ui.Box width={72} />

            <TabItem
                title='Profile'
                icon={({ isActive }) => (
                    <ui.Box borderColor={isActive ? colors.primary.background : 'transparent'} borderWidth='2px' round>
                        <UserAvatar user={profile} size={30} />
                    </ui.Box>
                )}
                isActive={isActive(routes.profile())}
                onPress={requireRegistration(() => navigation.navigate(routes.profile()))}
            />

            <ui.Box
                marginTop='4px'
                onPress={requireRegistration(() => navigation.navigate(routes.createRide()))}
                haptic
                width={72}
                pressOpacity={1}
                position='absolute'
                zIndex={3}
                left='50%'
                marginLeft='-36px'
            >
                <ui.Box height='100%' alignItems='center'>
                    <ui.Box flexCenter>
                        <ui.Box round bgPalette='primary' wh={56} flexCenter bottom='20px' position='absolute'>
                            {/* <ui.LottieBox
                                wh={36}
                                position='absolute'
                                // top={-2}
                                zIndex={4}
                                source={require('../../ui/lottie/rocket.json')}
                                autoPlay
                                loop={false}
                            /> */}
                            <icons.Plus width={24} height={24} fill='#fff' />
                        </ui.Box>

                        <ui.Image source={require('./tab-clip.png')} width={74} marginLeft='-1px' height={48} />
                    </ui.Box>
                    <ui.Text
                        fontSize={12}
                        colorVariant='caption'
                        center
                        position='absolute'
                        bottom={`${bottom + 8}px`}
                        zIndex={100}
                        children='Create Ride'
                    />

                    <ui.Box white width={74} marginLeft='-1px' flex height={bottom + 17} />
                </ui.Box>
            </ui.Box>
        </ui.Box>
    );
});

type TabItemProps = {
    title?: string;
    icon: ({ color, isActive }: { color: string; isActive: boolean }) => ReactNode;
    isActive: boolean;
    onPress: () => void;
};

const TabItem: FC<TabItemProps> = memo(({ icon, title, isActive, onPress }) => {
    const { colors, font, unit } = useTheme();
    const color = isActive ? colors.primary.background : font.variants.caption.color ?? '#ddd';
    const { bottom } = useSafeAreaInsets();

    return (
        <ui.Pressable
            zIndex={0}
            flexCenter
            flex
            onPress={onPress}
            pressOpacity={1}
            haptic
            paddingTop
            borderColor
            borderTopWidth
            borderLeftWidth
            borderRightWidth
            backgroundColor='#fff'
            borderTopLeftRadius={2}
            borderTopRightRadius={2}
            paddingBottom={`${Math.max(bottom, unit)}px`}
        >
            <ui.Box marginBottom={0.5} children={icon({ isActive, color })} wh={32} flexCenter />
            {typeof title === 'string' ? <ui.Text children={title} fontSize={12} color={color} /> : title}
        </ui.Pressable>
    );
});

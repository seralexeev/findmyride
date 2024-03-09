import { useNavigation } from '@react-navigation/native';
import React, { ComponentType, FC, ReactNode, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { icons, ui } from '..';
import { useViewContext } from '../../hooks/ViewContextProvider';
import { analytics } from '../../modules/analytics';

export type ScreenProps = ui.BoxProps & {
    topSafeArea?: boolean;
    bottomSafeArea?: boolean;
    header?: ReactNode;
    headerRight?: ReactNode;
    onBack?: () => void;
    white?: boolean;
    name: string;
};

export const Screen = ({
    children,
    topSafeArea = true,
    bottomSafeArea = true,
    backgroundColor = true,
    white,
    header,
    headerRight,
    onBack,
    name,
    ...props
}: ScreenProps) => {
    const { top, bottom } = useSafeAreaInsets();
    const inTabNavigator = useViewContext('TabNavigator');

    useEffect(() => analytics.logScreen(name), [name]);

    return (
        <ui.Box
            flex
            position='relative'
            paddingTop={topSafeArea && !header ? `${top}px` : 0}
            paddingBottom={bottomSafeArea && !inTabNavigator ? `${bottom}px` : 0}
            backgroundColor={white ? '#fff' : backgroundColor}
        >
            {header && <Header children={header} headerRight={headerRight} onBack={onBack} />}
            <ui.Box flex {...props}>
                {children}
            </ui.Box>
        </ui.Box>
    );
};

type HeaderProps = {
    headerRight?: ReactNode;
    onBack?: () => void;
    children?: ReactNode;
};

const Header: FC<HeaderProps> = ({ children, headerRight, onBack }) => {
    const { top } = useSafeAreaInsets();
    const { goBack } = useNavigation();

    const onBackPress = () => {
        onBack?.();
        goBack();
    };

    return (
        <ui.Box backgroundColor='#fff' paddingTop={`${top}px`} borderBottomWidth borderColor>
            <ui.Box row alignItems='center' justifyContent='space-between' paddingHorizontal height={56}>
                <ui.Box width='20%' fullHeight justifyContent='center' alignItems='flex-start'>
                    <ui.Button
                        onPress={onBackPress}
                        StartIcon={icons.ArrowLeft}
                        color='transparent'
                        // size='large'
                        borderVariant='round'
                    />
                </ui.Box>

                <ui.Box flex fullHeight flexCenter>
                    {typeof children === 'string' ? <ui.Text variant='title2' children={children} center /> : children}
                </ui.Box>

                <ui.Box width='20%' fullHeight justifyContent='center' alignItems='flex-end'>
                    <ui.Box row>{headerRight}</ui.Box>
                </ui.Box>
            </ui.Box>
        </ui.Box>
    );
};

Screen.wrap = <P,>(Component: ComponentType<WithScreenProps<P>>, screenProps?: ScreenProps) => {
    return function WrappedScreen(props: P) {
        const { goBack } = useNavigation();

        return (
            <Screen {...screenProps} name={Component.displayName ?? 'UnknownScreen'}>
                <Component {...props} goBack={goBack} />
            </Screen>
        );
    };
};

export type WithScreenProps<P> = P & { goBack: () => void };

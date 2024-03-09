import { array } from '@untype/toolbox';
import React, { ComponentType, FC, ReactElement, ReactNode, useEffect } from 'react';
import { ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { TabBar, TabView } from 'react-native-tab-view';
import { ui } from '..';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTheme } from '../ThemeProvider';
import { withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';
import { isReactComponent } from '../utils';

type TabProps = {
    title?: string;
    name: string;
    children?: ReactElement;
    Icon?: ComponentType<SvgProps> | ReactNode;
    customTitle?: (args: { color: string; focused: boolean }) => ReactNode;
    onPress?: () => void;
};

type TabsProps = {
    children: ReactNode[];
    style?: ViewStyle;
    tabBarStyle?: ViewStyle;
    lazy?: boolean;
    unmountOnChange?: boolean;
    onTabPress?: () => void;
    initialTab?: string;
};

export const Tab: FC<TabProps & ui.BoxProps> = () => null;

const TabsImpl: FC<TabsProps> = ({
    children,
    tabBarStyle,
    style,
    lazy,
    initialTab,
    onTabPress: onTabPressProps,
    unmountOnChange = true,
}) => {
    const tabs =
        React.Children.map(children, (x) => {
            if (!React.isValidElement<TabProps>(x)) {
                return;
            }

            const { title, customTitle, Icon, name, onPress, ...rest } = x.props;
            return { title, props: rest, customTitle, Icon, name, onPress };
        })?.filter(Boolean) ?? [];

    const [index, setIndex] = React.useState(0);
    const [isSwiping, onSwipeStart, onSwipeEnd] = useBooleanState(false);
    const { font, colors, border } = useTheme();

    useEffect(() => {
        const index = tabs.findIndex((x) => x.name === initialTab);
        if (index > -1) {
            setTimeout(() => setIndex(index), 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTab]);

    const items = array.reduceBy(
        tabs,
        (x) => x.name,
        (x) => x.props,
    );

    const routes = tabs.map(({ title, name, customTitle, onPress, Icon, props }) => ({
        key: name,
        title,
        Icon,
        customTitle,
        onPress,
        hasContent: Boolean(props.children),
    }));

    return (
        <TabView
            style={style}
            lazy={lazy}
            onIndexChange={setIndex}
            renderScene={({ route }) => {
                const props = items[route.key];
                if (!props?.children) {
                    return null;
                }

                const { children, ...rest } = props;
                return (
                    <ui.Box {...rest}>
                        {children ? (
                            <ui.Transition
                                flex
                                inAnimation='fadeIn'
                                outAnimation='fadeOut'
                                visible={!unmountOnChange || isSwiping || route.key === routes[index]?.key}
                                children={children}
                            />
                        ) : null}
                    </ui.Box>
                );
            }}
            onSwipeStart={onSwipeStart}
            onSwipeEnd={onSwipeEnd}
            navigationState={{ index, routes }}
            renderTabBar={(props) => (
                <TabBar
                    {...props}
                    activeColor={colors.primary.background}
                    inactiveColor={font.default.color}
                    indicatorStyle={{
                        backgroundColor: colors.primary.background,
                        height: 2,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                    }}
                    style={{
                        backgroundColor: 'transparent',
                        borderBottomColor: border.color,
                        borderBottomWidth: border.width,
                        elevation: 0,
                        ...tabBarStyle,
                    }}
                    onTabPress={(e) => {
                        onTabPressProps?.();
                        if (!e.route.hasContent) {
                            e.preventDefault();
                        }

                        e.route.onPress?.();
                    }}
                    renderLabel={({ route, color, focused }) => {
                        return (
                            <ui.Box row alignItems='center' flex marginHorizontal={0.5} overflowHidden>
                                {route.Icon ? (
                                    <ui.Box marginRight>
                                        {isReactComponent(route.Icon) ? (
                                            <route.Icon width={18} height={18} fill={color} />
                                        ) : (
                                            route.Icon
                                        )}
                                    </ui.Box>
                                ) : null}
                                {route.customTitle ? (
                                    route.customTitle({ color, focused })
                                ) : typeof route.title === 'string' ? (
                                    <ui.Text color={color} children={route.title} numberOfLines={1} />
                                ) : (
                                    route.title
                                )}
                            </ui.Box>
                        );
                    }}
                />
            )}
        />
    );
};

export const Tabs = withStyler(viewStyler)(TabsImpl);

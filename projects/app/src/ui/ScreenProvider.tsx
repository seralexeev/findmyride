import { useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { uuid } from '@untype/toolbox';
import React, { FC, ReactNode, useEffect, useState } from 'react';
import { createUseContext } from '../hooks/createUseContext';

type ScreenArgs = {
    goBack: () => void;
};

type ScreenProps = {
    children: ReactNode | ((args: ScreenArgs) => ReactNode);
    options?: StackNavigationOptions;
    removeScreen: () => void;
};

type ContextType = {
    showScreen: (args: {
        id?: string;
        onClose?: () => void;
        options?: StackNavigationOptions;
        children: ReactNode | ((args: ScreenArgs) => ReactNode);
    }) => void;
    screens: Record<string, ScreenProps>;
};

export const [useScreen, Provider] = createUseContext<ContextType>('ScreenProvider');

const Stack = createStackNavigator();

export const ScreenProviderHost: FC<{ children: ReactNode }> = ({ children }) => {
    const { screens } = useScreen();

    return (
        <Stack.Navigator>
            <Stack.Screen name='Root' children={() => children} />
            {Object.entries(screens).map(([key, { options, ...screen }]) => (
                <Stack.Screen key={key} name={key} children={() => <ScreenWrapper {...screen} />} options={options} />
            ))}
        </Stack.Navigator>
    );
};

export const ScreenProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [screens, setScreens] = useState<Record<string, ScreenProps>>({});
    // TODO: fixme
    const { navigate } = useNavigation<any>();

    const value: ContextType = {
        showScreen: ({ id = uuid.v4(), children: screen, options, onClose }) => {
            return new Promise<void>((res) => {
                setScreens((prev) => ({
                    ...prev,
                    [id]: {
                        children: screen,
                        options,
                        removeScreen: () => {
                            onClose?.();
                            setScreens(({ [id]: _, ...next }) => next);
                        },
                    },
                }));

                setTimeout(() => navigate(id), 0);
                setTimeout(res, 500);
            });
        },
        screens,
    };

    return <Provider value={value} children={children} />;
};

type ScreenWrapperProps = {
    removeScreen: () => void;
    children: ReactNode | ((args: ScreenArgs) => ReactNode);
};

const ScreenWrapper: FC<ScreenWrapperProps> = ({ removeScreen, children }) => {
    const { addListener, goBack } = useNavigation();
    useEffect(() => addListener('beforeRemove', removeScreen), []);

    return typeof children === 'function' ? children({ goBack }) : children;
};

import { useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { uuid } from '@untype/toolbox';
import React, { FC, memo, ReactNode, useEffect, useState } from 'react';
import { createUseContext } from '../hooks/createUseContext';

type ScreenChildren = ReactNode | ((args: { goBack: () => void }) => ReactNode);

type ScreenProps = {
    children: ScreenChildren;
    options?: StackNavigationOptions;
    removeScreen: () => void;
};

type ContextType = {
    showScreen: (args: {
        id?: string;
        onClose?: () => void;
        options?: StackNavigationOptions;
        children: ScreenChildren;
    }) => void;
};

export const [useScreen, Provider] = createUseContext<ContextType>('ScreenProvider');

const Stack = createStackNavigator();

const [useScreenNode, NodeProvider] = createUseContext<ReactNode>('ScreenNodeProvider');
export const ScreenNodeProvider: FC<{ children: ReactNode }> = memo(({ children }) => {
    const node = useScreenNode();

    return (
        <Stack.Navigator>
            <Stack.Screen name='Root' children={() => children} />
            {node}
        </Stack.Navigator>
    );
});

export const ScreenProvider: FC<{ children: ReactNode }> = memo(({ children }) => {
    const { navigate } = useNavigation<any>();
    const [screens, setScreens] = useState<Record<string, ScreenProps>>({});

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
    };

    const node = Object.entries(screens).map(([key, { options, ...screen }]) => (
        <Stack.Screen key={key} name={key} children={() => <ScreenWrapper {...screen} />} options={options} />
    ));

    return (
        <Provider value={value}>
            <NodeProvider value={node} children={children} />
        </Provider>
    );
});

type ScreenWrapperProps = {
    removeScreen: () => void;
    children: ScreenChildren;
};

const ScreenWrapper: FC<ScreenWrapperProps> = ({ removeScreen, children }) => {
    const { addListener, goBack } = useNavigation();
    useEffect(() => addListener('beforeRemove', removeScreen), []);

    return typeof children === 'function' ? children({ goBack }) : children;
};

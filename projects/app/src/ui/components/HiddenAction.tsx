import React, { FC, ReactNode, useRef } from 'react';
import { Pressable } from 'react-native';

export type HiddenActionProps = {
    count?: number;
    onAction?: () => void;
    children: ReactNode;
};

export const HiddenAction: FC<HiddenActionProps> = ({ count = 5, children, onAction }) => {
    const clicked = useRef(0);

    const onPress = () => {
        if (++clicked.current % count === 0) {
            onAction?.();
        }
    };

    return <Pressable onPress={onPress} children={children} />;
};

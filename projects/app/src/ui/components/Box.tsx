import React, { ReactNode } from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { StylerProps, withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';
import { Pressable, PressableProps } from './Pressable';

export type BoxProps = StylerProps<typeof viewStyler> & {
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    logEvent?: PressableProps['logEvent'];
    pressOpacity?: number;
    haptic?: boolean;
    children?: ReactNode;
    onLayout?: ViewProps['onLayout'];
};

export const Box = withStyler(viewStyler)(({ onPress, haptic, ...rest }: BoxProps) => {
    return onPress ? <Pressable haptic={haptic} onPress={onPress} {...rest} /> : <View {...rest} />;
});

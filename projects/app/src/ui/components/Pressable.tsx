import React from 'react';
import * as rn from 'react-native';
import { PressableStateCallbackType } from 'react-native';
import ReactNativeHaptic, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { useEvent } from '../../hooks/useEvent';
import { analytics } from '../../modules/analytics';
import { StylerProps, withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';

export type PressableProps = rn.PressableProps & {
    haptic?: boolean | HapticFeedbackTypes;
    pressOpacity?: number;
    logEvent?: (() => void) | string | [string, Record<string, string>];
} & StylerProps<typeof viewStyler>;

export const Pressable = withStyler(viewStyler)(({
    style,
    haptic,
    onPress,
    pressOpacity = 0.7,
    logEvent,
    ...props
}: PressableProps) => {
    const hapticType = haptic === true || haptic === false ? 'impactLight' : haptic;

    const styleCallback = useEvent((state: PressableStateCallbackType) => {
        const styleObject = typeof style === 'function' ? style(state) : style;
        return state.pressed ? [styleObject, { opacity: pressOpacity }] : styleObject;
    });

    const onPressHandle = useEvent((e: rn.GestureResponderEvent) => {
        if (hapticType) {
            ReactNativeHaptic.trigger(hapticType);
        }

        if (typeof logEvent === 'function') {
            logEvent();
        } else if (logEvent) {
            if (typeof logEvent === 'string') {
                analytics.logEvent(logEvent);
            } else {
                const [name, params] = logEvent;
                analytics.logEvent(name, params);
            }
        }
        onPress?.(e);
    });

    return <rn.Pressable {...props} onPress={onPressHandle} style={styleCallback} />;
});

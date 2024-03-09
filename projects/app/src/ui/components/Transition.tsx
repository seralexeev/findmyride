import React, { forwardRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useDebounce } from 'use-debounce';
import { StylerProps, withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';

export type TransitionProps = StylerProps<typeof viewStyler> & {
    duration?: number;
    delay?: number;
    inAnimation: Animatable.Animation;
    outAnimation?: Animatable.Animation;
    style?: StyleProp<ViewStyle>;
    onAnimationEnd?: () => void;
    visible?: boolean;
};

// eslint-disable-next-line react/display-name
const TransitionImpl = forwardRef<Animatable.View, React.PropsWithChildren<TransitionProps>>((props, ref) => {
    const { children, duration = 300, style, inAnimation, outAnimation, onAnimationEnd, delay, visible = true } = props;
    const [delayedVisible] = useDebounce(visible, duration);

    return visible || delayedVisible ? (
        <Animatable.View
            delay={delay}
            duration={duration}
            useNativeDriver
            animation={visible ? inAnimation : outAnimation}
            ref={ref as any}
            style={style}
            iterationCount={1}
            easing='ease-out'
            onAnimationEnd={onAnimationEnd}
            children={children}
        />
    ) : null;
});

export const Transition = withStyler(viewStyler)(TransitionImpl);

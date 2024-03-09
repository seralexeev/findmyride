import React, { FC, memo } from 'react';
import { ui } from '..';
import { useTheme } from '../ThemeProvider';
import { Theme } from '../theme';
import { LottieBoxProps } from './LottieBox';

export type SpinnerProps = Omit<LottieBoxProps, 'source'> & {
    color?: string;
    paletteColor?: keyof Theme['colors'];
    onFinish?: () => void;
};

export const Spinner: FC<SpinnerProps> = memo(function Spinner({ wh = 32, color, paletteColor = 'primary', ...props }) {
    const { colors } = useTheme();
    const colorFinal = color ?? (paletteColor && colors[paletteColor].background) ?? undefined;

    return (
        <ui.LottieBox
            source={require('../lottie/spinner.json')}
            autoPlay
            loop
            wh={wh}
            speed={1.2}
            {...props}
            colorFilters={colorFinal ? [{ keypath: 'circle-blue', color: colorFinal }] : undefined}
        />
    );
});

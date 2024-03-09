import React, { FC } from 'react';
import { ViewStyle } from 'react-native';
import { ui } from '..';
import { useTheme } from '../ThemeProvider';
import { withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';
import { Theme } from '../theme';

export type CardProps = ui.BoxProps & {
    color?: keyof Theme['colors'];
    style?: ViewStyle;
    onPress?: ui.PressableProps['onPress'];
    borderRadius?: ui.PressableProps['borderRadius'];
    paddingVertical?: number;
    paddingHorizontal?: number;
};

export const CardImpl: FC<CardProps> = ({ borderRadius = true, color = 'transparent', onPress, ...rest }) => {
    const { colors } = useTheme();

    const props = {
        ...rest,
        borderRadius,
        bgPalette: color,
        overflowHidden: true,
        borderWidth: colors[color].borderWidth,
        borderColor: colors[color].borderColor,
    };

    return onPress ? <ui.Pressable {...props} onPress={onPress} /> : <ui.Box {...props} />;
};

export const Card = withStyler(viewStyler)(CardImpl);

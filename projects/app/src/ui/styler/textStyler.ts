import * as rn from 'react-native';
import { createStylerFactory } from '../styler';
import { Theme } from '../theme';
import { styleCompose } from './helpers';

const createStyler = createStylerFactory<rn.TextStyle>(styleCompose);

export const textStyler = createStyler({
    bold: ({ font }) => font.bold,
    semiBold: ({ font }) => font.semiBold,
    fontWeight: (_, fontWeight: rn.TextStyle['fontWeight']) => ({ fontWeight }),
    fontStyle: (_, fontStyle: rn.TextStyle['fontStyle']) => ({ fontStyle }),
    fontVariant: (_, fontVariant: rn.TextStyle['fontVariant']) => ({ fontVariant }),
    tabular: { fontVariant: ['tabular-nums'] },
    opacity: (_, opacity: rn.TextStyle['opacity']) => ({ opacity }),
    fontSize: (_, fontSize: rn.TextStyle['fontSize']) => ({ fontSize, lineHeight: fontSize }),
    lineHeight: (_, lineHeight: rn.TextStyle['lineHeight']) => ({ lineHeight }),
    textAlign: (_, textAlign: rn.TextStyle['textAlign']) => ({ textAlign }),
    textAlignVertical: (_, textAlignVertical: rn.TextStyle['textAlignVertical']) => ({ textAlignVertical }),
    color: (_, color: rn.TextStyle['color']) => ({ color }),
    white: { color: '#fff' },
    center: { textAlign: 'center' },
    strike: { textDecorationLine: 'line-through', textDecorationStyle: 'solid' },
    colorPalette: ({ colors }, color: keyof Theme['colors']) => ({ color: colors[color].foreground }),
    colorVariant: ({ font }, variant: keyof Theme['font']['variants']) => ({ color: font.variants[variant].color }),
    variant: (config, variant: keyof Theme['font']['variants'] = 'body1') => config.font.variants[variant],
    underline: { textDecorationLine: 'underline' },
});

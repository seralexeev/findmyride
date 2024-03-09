import { ImageStyle, StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../theme';

export const unitHelper = (key: keyof ViewStyle) => numberMultiplierHelper(key, (x) => x.unit);
export const borderWidthHelper = (key: keyof ViewStyle) => numberMultiplierHelper(key, (x) => x.border.width);
export const borderRadiusHelper = (key: keyof ViewStyle) => numberMultiplierHelper(key, (x) => x.border.radius);

export const numberMultiplierHelper = (key: keyof ViewStyle, selector: (config: Theme) => number) => {
    return (config: Theme, value: string | number = 1) => ({
        [key]: typeof value === 'string' ? tryGetPixel(value) : selector(config) * value,
    });
};

const tryGetPixel = (value: string) => {
    if (value.endsWith('px')) {
        return parseFloat(value.substring(0, value.length - 2));
    }

    return value;
};

export type RnStyle = ViewStyle | ImageStyle | TextStyle;

export function styleCompose(...styles: Array<StyleProp<ViewStyle>>): StyleProp<ViewStyle>;
export function styleCompose(...styles: Array<StyleProp<ImageStyle>>): StyleProp<ImageStyle>;
export function styleCompose(...styles: Array<StyleProp<TextStyle>>): StyleProp<TextStyle>;
export function styleCompose(...styles: any[]) {
    if (styles.length === 1) {
        return styles[0];
    }

    if (styles.length <= 2) {
        return StyleSheet.compose(styles[0], styles[1]);
    }

    return styles.filter(Boolean);
}

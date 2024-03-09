import { Colors } from '@findmyride/api';
import { Platform, StyleSheet } from 'react-native';

export const theme: Theme = {
    // background: '#F2F1F6',
    background: '#FBF3EB',
    border: {
        color: '#DBDADB',
        width: StyleSheet.hairlineWidth,
        radius: 6,
    },
    colors: {
        light: {
            background: '#fff',
            foreground: '#111111',
            borderWidth: 1,
            borderColor: '#DBDADB',
        },
        transparent: {
            background: 'transparent',
            foreground: '#111111',
        },
        primary: {
            background: Colors.primary,
            foreground: '#fff',
        },
        secondary: {
            background: '#111111',
            foreground: '#fff',
        },
        tertiary: {
            background: '#F2F3EE',
            foreground: '#111111',
        },
        success: {
            background: '#DCF3DE',
            foreground: '#27C335',
        },
        warning: {
            background: '#FFF3C7',
            foreground: '#111111',
        },
        danger: {
            background: '#FBE7E6',
            foreground: Colors.primary,
        },
    },
    font: {
        default: {
            fontFamily: Platform.select({ android: 'roboto', ios: 'Roboto' }) ?? 'Roboto',
            fontSize: 16,
            color: '#111111',
        },
        bold: {
            ...Platform.select({
                android: { fontFamily: 'roboto_medium' },
                ios: { fontFamily: 'Roboto', fontWeight: '600' },
            }),
        },
        semiBold: {
            ...Platform.select({
                android: { fontFamily: 'roboto_medium' },
                ios: { fontFamily: 'Roboto', fontWeight: '600' },
            }),
        },
        variants: {
            title1: {
                fontFamily: 'cirka_bold',
                fontSize: 48,
                lineHeight: 48,
            },
            title2: {
                fontFamily: 'cirka_bold',
                fontSize: 20,
                lineHeight: 20,
            },
            body1: {
                fontSize: 14,
                lineHeight: 21,
            },
            body2: {
                fontSize: 12,
                lineHeight: 18,
            },
            subtitle1: {
                ...Platform.select({
                    android: { fontFamily: 'roboto_medium' },
                    ios: { fontFamily: 'Roboto', fontWeight: '600' },
                }),
                fontSize: 22,
                lineHeight: 22,
            },
            subtitle2: {
                ...Platform.select({
                    android: { fontFamily: 'roboto_medium' },
                    ios: { fontFamily: 'Roboto', fontWeight: '600' },
                }),
                fontSize: 20,
                lineHeight: 20,
            },
            caption: {
                fontSize: 12,
                lineHeight: 18,
                color: '#ADADAD',
            },
        },
    },
    unit: 8,
};

type FontConfig = {
    fontFamily: string;
    fontSize: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    color?: string;
    lineHeight?: number;
};

type ColorConfig = {
    background: string;
    foreground: string;
    borderWidth?: number;
    borderColor?: string;
};

export type Theme = {
    unit: number;
    background: string;
    border: {
        color: string;
        width: number;
        radius: number;
    };
    colors: {
        light: ColorConfig;
        transparent: ColorConfig;
        primary: ColorConfig;
        secondary: ColorConfig;
        tertiary: ColorConfig;
        success: ColorConfig;
        warning: ColorConfig;
        danger: ColorConfig;
    };
    font: {
        default: FontConfig;
        bold: Partial<FontConfig>;
        semiBold: Partial<FontConfig>;
        variants: {
            title1: Partial<FontConfig>;
            title2: Partial<FontConfig>;
            subtitle1: Partial<FontConfig>;
            subtitle2: Partial<FontConfig>;
            body1: Partial<FontConfig>;
            body2: Partial<FontConfig>;
            caption: Partial<FontConfig>;
        };
    };
};

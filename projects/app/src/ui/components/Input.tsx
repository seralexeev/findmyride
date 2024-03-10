import React, { ComponentType, forwardRef, ReactNode, useEffect, useRef } from 'react';
import * as rn from 'react-native';
import { SvgProps } from 'react-native-svg';
import { icons, ui } from '..';
import { Theme } from '../theme';
import { useTheme } from '../ThemeProvider';
import { isReactComponent, mergeRefs } from '../utils';

type IconProps = { width?: number; height?: number; fill?: string };

export type InputProps = rn.TextInputProps & {
    loading?: boolean;
    disabled?: boolean;
    color?: keyof Theme['colors'];
    StartIcon?: ReactNode | ComponentType<SvgProps>;
    focused?: boolean;
};

export const Input = forwardRef(function Input(
    { loading, disabled, color = 'transparent', StartIcon, focused, placeholderTextColor, ...props }: InputProps,
    outerRef,
) {
    const { colors, border, font } = useTheme();
    const ref = useRef<rn.TextInput | null>(null);

    placeholderTextColor ??= border.color;

    useEffect(() => {
        focused ? ref.current?.focus() : ref.current?.blur();
    }, [focused]);

    const style: rn.StyleProp<rn.TextStyle> = {
        width: '100%',
        fontFamily: font.variants.body1.fontFamily,
        fontSize: 16,
        lineHeight: 18,
        paddingVertical: 0,
        color: colors[color].foreground,
        height: props.multiline ? 18 * 10 : 18,
        flex: 1,
    };

    const startIcon = loading ? (
        <ui.Spinner wh={14} color={colors[color].foreground} />
    ) : isReactComponent(StartIcon) ? (
        <StartIcon {...iconProps} />
    ) : (
        StartIcon
    );

    return (
        <ui.Box
            bgPalette={color}
            row
            paddingLeft={1.75}
            borderRadius
            borderWidth={colors[color].borderWidth}
            borderColor={colors[color].borderColor}
        >
            <ui.Box paddingVertical='10px' row flex alignItems='center'>
                {startIcon && <ui.Box marginRight={1.5} children={startIcon} />}
                <rn.TextInput
                    ref={mergeRefs(ref, outerRef)}
                    {...props}
                    style={style}
                    numberOfLines={1}
                    placeholderTextColor={placeholderTextColor}
                />
            </ui.Box>

            {Boolean(props.value) && (
                <ui.Pressable marginLeft={1.5} onPress={() => props.onChangeText?.('')} wh={38} flexCenter haptic>
                    <icons.Clear height={24} width={24} fill={border.color} />
                </ui.Pressable>
            )}

            {disabled && <ui.Box fillContainer backgroundColor='#fff' opacity={0.7} />}
        </ui.Box>
    );
});

const iconProps: IconProps = {
    height: 14,
    width: 14,
};

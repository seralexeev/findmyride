import React, { ComponentType, FC, Fragment, memo, ReactNode } from 'react';
import { SvgProps } from 'react-native-svg';
import { ui } from '..';
import { useLoadCallback } from '../../hooks/useLoadingCallback';
import { Theme } from '../theme';
import { useTheme } from '../ThemeProvider';
import { isReactComponent } from '../utils';

type Size = 'small' | 'medium' | 'large';

export type ButtonProps = ui.BoxProps & {
    loading?: boolean;
    disabled?: boolean;
    color?: keyof Theme['colors'];
    textColor?: keyof Theme['colors'];
    StartIcon?: ReactNode | ComponentType<SvgProps>;
    EndIcon?: ReactNode | ComponentType<SvgProps>;
    size?: Size;
    borderVariant?: 'default' | 'round';
    fillIcon?: boolean;
    selectable?: boolean;
    caption?: boolean;
    semiBold?: boolean;
    iconColor?: string;
};

export const Button: FC<ButtonProps> = memo(function Button({
    children,
    loading: loadingProps,
    onPress: onPressProps,
    disabled: disabledProps,
    StartIcon,
    EndIcon,
    color = 'primary',
    textColor,
    size = 'medium',
    borderVariant = 'default',
    fillIcon = true,
    selectable = false,
    caption,
    semiBold,
    iconColor,
    ...props
}) {
    const { colors } = useTheme();
    const [onPress, isActionLoading] = useLoadCallback(onPressProps);
    const loading = loadingProps || isActionLoading;
    const disabled = disabledProps || loading;

    const sizeConfig = sizeConfigs[size];
    const iconProps: SvgProps = {
        height: sizeConfig.iconHeight,
        width: sizeConfig.iconHeight,
    };

    if (fillIcon) {
        iconProps.fill = iconColor ?? colors[color].foreground;
    }

    const startIcon = isReactComponent(StartIcon) ? <StartIcon {...iconProps} /> : StartIcon;
    const endIcon = isReactComponent(EndIcon) ? <EndIcon {...iconProps} /> : EndIcon;

    const paddingHorizontal = borderVariant === 'round' ? sizeConfig.paddingHorizontalRound : sizeConfig.paddingHorizontal;

    const textProps: ui.TextProps = caption
        ? { variant: 'caption' }
        : { bold: sizeConfig.bold, semiBold: sizeConfig.semiBold ?? semiBold, colorPalette: textColor ?? color };

    const borderRadius = borderVariant === 'default' ? sizeConfig.borderRadius : 1000;
    const wrapperProps: ui.BoxProps = {
        borderRadius,
        bgPalette: color,
        // overflowHidden: true,
        borderWidth: colors[color].borderWidth,
        borderColor: colors[color].borderColor,
        minHeight: sizeConfig.minHeight,
        justifyContent: 'center',
        ...props,
    };

    const content = (
        <Fragment>
            <ui.Box row alignItems='center' justifyContent='center' opacity={loading ? 0.1 : 1}>
                {startIcon && (
                    <ui.Box
                        marginLeft={children ? paddingHorizontal : sizeConfig.iconHorizontalMargin}
                        marginRight={sizeConfig.iconHorizontalMargin}
                        children={startIcon}
                    />
                )}
                {children && (
                    <ui.Box
                        marginTop={sizeConfig.textMarginBottom}
                        paddingLeft={startIcon ? 0 : paddingHorizontal}
                        paddingRight={endIcon ? 0 : paddingHorizontal}
                        flexShrink={1}
                        justifyContent='center'
                        overflow='visible'
                    >
                        {typeof children === 'string' ? (
                            <ui.Text
                                {...textProps}
                                fontSize={sizeConfig.fontSize}
                                lineHeight={
                                    typeof sizeConfig.fontSize === 'number' ? sizeConfig.fontSize * 1.5 : sizeConfig.fontSize
                                }
                                textAlignVertical='center'
                                children={children}
                                numberOfLines={1}
                                marginTop={`${sizeConfig.textFix}px`}
                                marginBottom={`-${sizeConfig.textFix}px`}
                                textAlign='center'
                                selectable={selectable}
                            />
                        ) : (
                            children
                        )}
                    </ui.Box>
                )}
                {endIcon && (
                    <ui.Box
                        marginRight={children ? paddingHorizontal : sizeConfig.iconHorizontalMargin}
                        marginLeft={sizeConfig.iconHorizontalMargin}
                        children={endIcon}
                    />
                )}
            </ui.Box>

            {onPressProps && (
                <ui.Transition
                    visible={loading}
                    fillContainer
                    flexCenter
                    bgPalette={color}
                    inAnimation='fadeIn'
                    outAnimation='fadeOut'
                    duration={100}
                    borderRadius={borderRadius}
                    overflowHidden
                >
                    <ui.Spinner wh={sizeConfig.spinnerSize} color={colors[color].foreground} />
                </ui.Transition>
            )}
            {disabled && (
                <ui.Box fillContainer backgroundColor='#fff' opacity={0.7} borderRadius={borderRadius} overflowHidden />
            )}
        </Fragment>
    );

    return onPressProps ? (
        <ui.Pressable {...wrapperProps} disabled={disabled || loading} onPress={onPress} children={content} />
    ) : (
        <ui.Box {...wrapperProps} children={content} />
    );
});

type SizeConfig = {
    // paddingVertical: ui.BoxProps['padding'];
    paddingHorizontal: number;
    paddingHorizontalRound: number;
    iconHeight: number;
    iconHorizontalMargin: ui.BoxProps['margin'];
    spinnerSize: ui.BoxProps['wh'];
    fontSize: ui.TextProps['fontSize'];
    textMarginBottom: ui.BoxProps['paddingTop'];
    borderRadius: ui.BoxProps['borderRadius'];
    textFix: number;
    bold?: true;
    semiBold?: true;
    minHeight: ui.BoxProps['minHeight'];
};

const sizeConfigs: Record<Size, SizeConfig> = {
    small: {
        paddingHorizontal: 1.125,
        paddingHorizontalRound: 2,
        iconHeight: 10,
        iconHorizontalMargin: 1.125,
        spinnerSize: 12,
        fontSize: 11,
        textMarginBottom: 0,
        borderRadius: 0.75,
        textFix: 0,
        semiBold: true,
        minHeight: 28,
    },
    medium: {
        paddingHorizontal: 1.25,
        paddingHorizontalRound: 2.5,
        iconHeight: 16,
        iconHorizontalMargin: 1.25,
        spinnerSize: 16,
        fontSize: 14,
        textMarginBottom: 0,
        borderRadius: 1,
        textFix: 0,
        minHeight: 36,
    },
    large: {
        paddingHorizontal: 1.75,
        paddingHorizontalRound: 2.5,
        iconHeight: 20,
        iconHorizontalMargin: 1.75,
        spinnerSize: 20,
        fontSize: 16,
        textMarginBottom: '0px',
        borderRadius: 1.5,
        textFix: 0,
        minHeight: 48,
    },
};

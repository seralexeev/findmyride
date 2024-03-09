import React, { FC } from 'react';
import * as rn from 'react-native';
import { StylerProps, withStyler } from '../styler';
import { textStyler } from '../styler/textStyler';
import { viewStyler } from '../styler/viewStyler';

const styler = { ...textStyler, ...viewStyler };

export type TextProps = rn.TextProps & StylerProps<typeof styler>;

const StylerText = withStyler(styler)((props: rn.TextProps) => {
    return <rn.Text lineBreakMode='tail' ellipsizeMode='tail' {...props} />;
});

export const Text: FC<TextProps> = ({ variant = 'body1', ...props }) => {
    // props.children = typeof props.children === 'string' ? props.children.repeat(5) : props.children;
    return <StylerText variant={variant} {...props} />;
};

const applyDefaultProps = (Component: any) => {
    Component.defaultProps = Component.defaultProps || {};
    Component.defaultProps.allowFontScaling = false;
};

applyDefaultProps(rn.Text);

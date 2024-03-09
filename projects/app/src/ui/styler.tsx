import React, { ComponentType, forwardRef } from 'react';
import { useTheme } from './ThemeProvider';
import { Theme } from './theme';

type StylerValue<TStyleEnv> = Partial<TStyleEnv> | ((config: Theme, value?: any) => Partial<TStyleEnv>);
type Styler<TStyleEnv> = Record<string, StylerValue<TStyleEnv>>;
const combineKey = Symbol('combineKey');

export const createStylerFactory = <TStyleEnv,>(combine: (...style: any[]) => any) => {
    return <TStyler extends Styler<TStyleEnv>>(styler: TStyler) => {
        (styler as any)[combineKey] = combine;

        return styler;
    };
};

export const withStyler = <TStyleEnv, TStyler extends Record<string, TStyleEnv>>(styler: TStyler) => {
    const combine = (styler as any)[combineKey];
    return <TProps extends { style?: TStyleEnv }>(Component: ComponentType<TProps>) => {
        // eslint-disable-next-line react/display-name
        return forwardRef((combinedProps: TProps & StylerProps<TStyler>, ref: any) => {
            const config = useTheme();

            const style: Record<string, TStyleEnv> = {};
            const props: Record<string, any> = {};

            for (const key in combinedProps) {
                if (key in styler) {
                    const value = resolveProp(config, combinedProps[key], styler[key]);
                    if (value != null) {
                        Object.assign(style, value);
                    }
                } else {
                    props[key] = combinedProps[key];
                }
            }

            const finalStyle = combine({}, props.style, style);

            return <Component {...(props as any)} style={finalStyle} ref={ref} />;
        });
    };
};

const resolveProp = (config: any, prop: any, styler: any) => {
    if (prop == null) {
        return undefined;
    }

    if (typeof styler === 'function') {
        if (prop === true || prop === false) {
            return prop === true ? styler(config) : undefined;
        }

        return styler(config, prop);
    }

    return prop ? styler : undefined;
};

type InferArg<T> = T extends (_: any, arg: infer A) => any ? (A extends undefined ? true : A) : boolean;
export type StylerProps<T> = {
    [K in keyof T]+?: InferArg<T[K]>;
};

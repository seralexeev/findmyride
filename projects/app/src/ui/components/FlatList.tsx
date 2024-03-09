import React, { Fragment, useState } from 'react';
import * as rn from 'react-native';
import { ui } from '..';
import { useTheme } from '../ThemeProvider';
import { StylerProps, withStyler } from '../styler';
import { styleCompose } from '../styler/helpers';
import { marginStyler, paddingStyler } from '../styler/viewStyler';

export type FlatListProps<T> = rn.FlatListProps<T> &
    StylerProps<typeof marginStyler> &
    StylerProps<typeof paddingStyler> & {
        scrollBorder?: boolean;
    };

const FlatListType = <T,>(props: FlatListProps<T>) => <Fragment {...props} />;

const InnerStyledFlatList = withStyler(paddingStyler)(<T,>({ style, ...props }: FlatListProps<T>) => {
    return (
        <rn.FlatList
            {...props}
            contentContainerStyle={style}
            /** https://github.com/facebook/react-native/issues/26610 */
            scrollIndicatorInsets={{ right: 1 }}
            keyboardShouldPersistTaps='always'
        />
    );
}) as any as typeof FlatListType;

export const FlatList = withStyler(marginStyler)(<T,>({ style, scrollBorder, ...props }: FlatListProps<T>) => {
    const [hasOffset, setHasOffset] = useState(false);
    const { border } = useTheme();

    const onScroll = scrollBorder
        ? (event: rn.NativeSyntheticEvent<rn.NativeScrollEvent>) => {
              setHasOffset(event.nativeEvent.contentOffset.y > 0);
              props.onScroll?.(event);
          }
        : props.onScroll;

    const list = <InnerStyledFlatList {...props} onScroll={onScroll} />;

    return scrollBorder ? (
        <ui.Box style={styleCompose(style, getOffsetStyle(hasOffset, border.color))} flex children={list} />
    ) : (
        list
    );
}) as any as typeof FlatListType;

const getOffsetStyle = (hasOffset: boolean, scrollLineColor: string | undefined): rn.StyleProp<rn.ViewStyle> => {
    return hasOffset
        ? { borderTopColor: scrollLineColor, borderTopWidth: rn.StyleSheet.hairlineWidth }
        : { borderTopColor: 'transparent', borderTopWidth: rn.StyleSheet.hairlineWidth };
};

const createBoxSeparator = (spacing: number) => {
    return function BoxSeparator() {
        return <ui.Box paddingBottom={spacing} paddingRight={spacing} />;
    };
};

const createDividerSeparator = (spacing: number) => {
    return function DividerSeparator() {
        return <ui.Divider marginVertical={spacing} />;
    };
};

export const BoxSeparator = {
    1: createBoxSeparator(1),
    2: createBoxSeparator(2),
    3: createBoxSeparator(3),
    4: createBoxSeparator(4),
};

export const DividerSeparator = {
    1: createDividerSeparator(1),
    2: createDividerSeparator(2),
    3: createDividerSeparator(3),
    4: createDividerSeparator(4),
};

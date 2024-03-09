import React, { useState } from 'react';
import * as rn from 'react-native';
import * as gh from 'react-native-gesture-handler';
import { useTheme } from '../ThemeProvider';
import { StylerProps, withStyler } from '../styler';
import { colorStyler, flexStyler, marginStyler, paddingStyler, sizeStyler } from '../styler/viewStyler';

export type ScrollViewProps = { scrollBorder?: boolean } & rn.ScrollViewProps &
    StylerProps<typeof marginStyler> &
    StylerProps<typeof paddingStyler> &
    StylerProps<typeof flexStyler> &
    StylerProps<typeof colorStyler> &
    StylerProps<typeof sizeStyler>;

export const ScrollView = withStyler({ ...paddingStyler, ...flexStyler })(({
    style,
    scrollBorder = true,
    ...props
}: ScrollViewProps) => {
    const [hasOffset, setHasOffset] = useState(false);
    const { border } = useTheme();

    const onScroll = scrollBorder
        ? (event: rn.NativeSyntheticEvent<rn.NativeScrollEvent>) => {
              setHasOffset(event.nativeEvent.contentOffset.y > 0);
              props.onScroll?.(event);
          }
        : props.onScroll;

    return (
        <gh.ScrollView
            {...props}
            contentContainerStyle={style}
            showsHorizontalScrollIndicator={false}
            /** https://github.com/facebook/react-native/issues/26610 */
            scrollIndicatorInsets={{ right: 1 }}
            keyboardShouldPersistTaps='always'
            onScroll={onScroll}
            style={getOffsetStyle(hasOffset, border.color)}
            scrollEventThrottle={scrollBorder ? 1 : undefined}
        />
    );
});

const getOffsetStyle = (hasOffset: boolean, scrollLineColor: string | undefined): rn.StyleProp<rn.ViewStyle> => {
    return hasOffset
        ? { borderTopColor: scrollLineColor, borderTopWidth: rn.StyleSheet.hairlineWidth }
        : { borderTopColor: 'transparent', borderTopWidth: rn.StyleSheet.hairlineWidth };
};

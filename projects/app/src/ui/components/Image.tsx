import React, { memo } from 'react';
import {
    DimensionValue,
    ImageResizeMode,
    Image as ReactNativeImage,
    ImageProps as ReactNativeImageProps,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { useDebounce } from 'use-debounce';
import { ui } from '..';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTheme } from '../ThemeProvider';
import { StylerProps, withStyler } from '../styler';
import { borderStyler, marginStyler, viewStyler } from '../styler/viewStyler';
import { Theme } from '../theme';

type FileImageImplProps = {
    image: any; // ImageWithSizes;
    size?: any; // ImageSize;
    color?: keyof Theme['colors'];
    aspectRatio?: number;
    resizeMode?: ImageResizeMode;
    width?: DimensionValue;
    height?: number;
    style?: StyleProp<ViewStyle>;
    loader?: boolean;
};

export const FileImageImpl = memo(function FileImageImpl({
    image,
    size = 'large',
    color = 'tertiary',
    aspectRatio,
    resizeMode = 'cover',
    width,
    height,
    style,
    loader = true,
}: FileImageImplProps) {
    const { colors, border } = useTheme();
    const [isLoading, onLoadStart, onLoadEnd] = useBooleanState();
    const [isLoadingDebounced] = useDebounce(isLoading, 50);

    if (!image.imageSizes) {
        return null;
    }

    const config = image.imageSizes[size];
    aspectRatio ??= ((typeof width === 'number' ? width : null) ?? config.width) / (height ?? config.height);

    return (
        <ui.Box style={style} aspectRatio={aspectRatio} width={width} height={height} position='relative'>
            <Image
                style={StyleSheet.absoluteFillObject}
                source={{ uri: config.url }}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                resizeMode={resizeMode}
            />
            {loader && (
                <ui.Transition
                    zIndex={1}
                    inAnimation='fadeIn'
                    outAnimation='fadeOut'
                    visible={isLoadingDebounced}
                    fillContainer
                    backgroundColor={colors[color].background}
                    flexCenter
                >
                    <ui.Spinner wh={16} color={border.color} />
                </ui.Transition>
            )}
        </ui.Box>
    );
});

export type FileImageProps = FileImageImplProps & StylerProps<typeof marginStyler> & StylerProps<typeof borderStyler>;
export const FileImage = withStyler({ ...marginStyler, ...borderStyler })(FileImageImpl);

export const Image = withStyler(viewStyler)((props: ReactNativeImageProps) => {
    return <ReactNativeImage {...props} />;
});

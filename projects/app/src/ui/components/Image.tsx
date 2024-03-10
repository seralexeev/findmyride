import { FileSchema, ImageSchema } from '@findmyride/api';
import React from 'react';
import {
    DimensionValue,
    ImageResizeMode,
    Image as ReactNativeImage,
    ImageProps as ReactNativeImageProps,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Blurhash } from 'react-native-blurhash';
import { useDebounce } from 'use-debounce';
import { ui } from '..';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTheme } from '../ThemeProvider';
import { StylerProps, withStyler } from '../styler';
import { borderStyler, marginStyler, viewStyler } from '../styler/viewStyler';
import { Theme } from '../theme';

type FileImageImplProps = {
    image: FileSchema;
    size?: 'small' | 'medium' | 'large';
    color?: keyof Theme['colors'];
    aspectRatio?: number;
    resizeMode?: ImageResizeMode;
    width?: DimensionValue;
    height?: number;
    style?: StyleProp<ViewStyle>;
    loader?: boolean;
};

export const FileImageImpl = function FileImageImpl({
    image: maybeImage,
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
    const imageParsed = ImageSchema.safeParse(maybeImage);
    if (!imageParsed.success) {
        return null;
    }

    const image = imageParsed.data;

    aspectRatio ??= ((typeof width === 'number' ? width : null) ?? image.width) / (height ?? image.height);

    return (
        <ui.Box style={style} aspectRatio={aspectRatio} width={width} height={height} position='relative'>
            <Image
                style={StyleSheet.absoluteFillObject}
                source={{ uri: image.url }}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                resizeMode={resizeMode}
            />
            {loader && (
                <ui.Transition
                    style={StyleSheet.absoluteFillObject}
                    zIndex={1}
                    inAnimation='fadeIn'
                    outAnimation='fadeOut'
                    visible={isLoadingDebounced}
                    fillContainer
                    backgroundColor={colors[color].background}
                    flexCenter
                >
                    {image.blurhash != null && <Blurhash blurhash={image.blurhash} style={StyleSheet.absoluteFillObject} />}
                    <ui.Spinner wh={16} color={border.color} opacity={0.5} />
                </ui.Transition>
            )}
        </ui.Box>
    );
};

export type FileImageProps = FileImageImplProps & StylerProps<typeof marginStyler> & StylerProps<typeof borderStyler>;
export const FileImage = withStyler({ ...marginStyler, ...borderStyler })(FileImageImpl);

export const Image = withStyler(viewStyler)((props: ReactNativeImageProps) => {
    return <ReactNativeImage {...props} />;
});

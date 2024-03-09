import { Dimensions, Platform, StyleSheet, ViewStyle } from 'react-native';
import { createStylerFactory } from '../styler';
import { Theme } from '../theme';
import { borderRadiusHelper, borderWidthHelper, styleCompose, unitHelper } from './helpers';

const createStyler = createStylerFactory<ViewStyle>(styleCompose);

export const paddingStyler = createStyler({
    paddingTop: unitHelper('paddingTop'),
    paddingRight: unitHelper('paddingRight'),
    paddingBottom: unitHelper('paddingBottom'),
    paddingLeft: unitHelper('paddingLeft'),
    paddingVertical: unitHelper('paddingVertical'),
    paddingHorizontal: unitHelper('paddingHorizontal'),
    padding: unitHelper('padding'),
});

export const marginStyler = createStyler({
    marginTop: unitHelper('marginTop'),
    marginRight: unitHelper('marginRight'),
    marginBottom: unitHelper('marginBottom'),
    marginLeft: unitHelper('marginLeft'),
    marginVertical: unitHelper('marginVertical'),
    marginHorizontal: unitHelper('marginHorizontal'),
    margin: unitHelper('margin'),
});

export const borderStyler = createStyler({
    borderRadius: borderRadiusHelper('borderRadius'),
    borderTopLeftRadius: borderRadiusHelper('borderTopLeftRadius'),
    borderTopRightRadius: borderRadiusHelper('borderTopRightRadius'),
    borderBottomRightRadius: borderRadiusHelper('borderBottomRightRadius'),
    borderBottomLeftRadius: borderRadiusHelper('borderBottomLeftRadius'),
    borderWidth: borderWidthHelper('borderWidth'),
    borderTopWidth: borderWidthHelper('borderTopWidth'),
    borderRightWidth: borderWidthHelper('borderRightWidth'),
    borderBottomWidth: borderWidthHelper('borderBottomWidth'),
    borderLeftWidth: borderWidthHelper('borderLeftWidth'),
    borderColor: ({ colors, border }, borderColor: ViewStyle['borderColor'] = border.color) => {
        return {
            borderColor: borderColor && borderColor in colors ? (colors as any)[borderColor].background : borderColor,
        };
    },

    overflow: (_, overflow: ViewStyle['overflow']) => ({ overflow }),
    overflowHidden: { overflow: 'hidden' },
    round: { borderRadius: 9999999 },
});

export const sizeStyler = createStyler({
    height: (_, height: ViewStyle['height']) => ({ height }),
    width: (_, width: ViewStyle['width']) => ({ width }),
    minWidth: (_, minWidth: ViewStyle['minWidth']) => ({ minWidth }),
    maxWidth: (_, maxWidth: ViewStyle['maxWidth']) => ({ maxWidth }),
    minHeight: (_, minHeight: ViewStyle['minHeight']) => ({ minHeight }),
    maxHeight: (_, maxHeight: ViewStyle['maxHeight']) => ({ maxHeight }),
    wh: (_, wh: ViewStyle['width']) => ({ width: wh, height: wh }),
    fullHeight: { height: '100%' },
    fullWidth: { width: '100%' },
    fullScreenWidth: { width: Dimensions.get('screen').width },
    aspectRatio: (_, aspectRatio: ViewStyle['aspectRatio']) => ({ aspectRatio }),
});

export const positionStyler = createStyler({
    top: unitHelper('top'),
    right: unitHelper('right'),
    bottom: unitHelper('bottom'),
    left: unitHelper('left'),
    zIndex: (_, zIndex: number) => ({ zIndex }),
    position: (_, position: ViewStyle['position']) => ({ position }),
    absolute: { position: 'absolute' },
    fillContainer: StyleSheet.absoluteFillObject,
});

export const flexStyler = createStyler({
    flex: (_, flex: ViewStyle['flex'] = 1) => ({ flex }),
    flexGrow: (_, flexGrow: ViewStyle['flexGrow'] = 1) => ({ flexGrow }),
    flexShrink: (_, flexShrink: ViewStyle['flexShrink'] = 1) => ({ flexShrink }),
    flexWrap: { flexWrap: 'wrap' },
    row: { flexDirection: 'row' },
    justifyContent: (_, justifyContent: ViewStyle['justifyContent']) => ({ justifyContent }),
    alignSelf: (_, alignSelf: ViewStyle['alignSelf']) => ({ alignSelf }),
    spaceBetween: { justifyContent: 'space-between' },
    alignItems: (_, alignItems: ViewStyle['alignItems']) => ({ alignItems }),
    flexCenter: { justifyContent: 'center', alignItems: 'center' },
});

export const colorStyler = createStyler({
    backgroundColor: ({ background }, backgroundColor: ViewStyle['backgroundColor'] = background) => ({ backgroundColor }),
    opacity: (_, opacity: number) => ({ opacity }),
    bgPalette: ({ colors }, color: keyof Theme['colors']) => ({ backgroundColor: colors[color].background }),
    white: { backgroundColor: '#fff' },
});

export const shadowStyler = createStyler({
    shadow: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.13,
            shadowRadius: 10,
        },
        android: { elevation: 3 },
    })!,
});

export const viewStyler = createStyler({
    ...paddingStyler,
    ...marginStyler,
    ...sizeStyler,
    ...flexStyler,
    ...borderStyler,
    ...colorStyler,
    ...positionStyler,
    ...shadowStyler,
});

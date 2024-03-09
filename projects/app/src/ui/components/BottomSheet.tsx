import BottomSheet, * as bs from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';
import { FlatList, FlatListProps } from './FlatList';
import { ScrollViewProps } from './ScrollView';

export const BottomSheetScrollView = withStyler(viewStyler)(({ style, ...props }: ScrollViewProps) => {
    return <bs.BottomSheetScrollView {...(props as any)} contentContainerStyle={style as any} />;
});

export const BottomSheetFlatList = withStyler(viewStyler)(<T,>({ style, ...props }: FlatListProps<T>) => {
    return <bs.BottomSheetFlatList {...(props as any)} contentContainerStyle={style as any} />;
}) as typeof FlatList;

export const useBottomSheetHelper = (
    snapPoints: Array<string | number>,
    {
        onChange: onChangeAction,
        withRounds,
    }: {
        withRounds?: boolean;
        onChange?: (index: number) => void;
    } = {},
) => {
    const { border } = useTheme();
    const [index, setIndex] = useState<number>();
    const bottomSheetRef = useRef<BottomSheet>(null);

    const onChange = (index: number) => {
        setIndex(index);
        onChangeAction?.(index);
    };

    return [
        bottomSheetRef,
        {
            snapPoints,
            onChange,
            backgroundStyle: withRounds
                ? {
                      borderRadius: index === snapPoints.length - 1 ? 0 : border.radius * 2,
                      borderWidth: index === snapPoints.length - 1 ? 0 : border.width,
                      borderColor: border.color,
                  }
                : null,
        },
        index,
    ] as const;
};

export const BottomSheetBackdrop = (props: bs.BottomSheetBackdropProps) => {
    return (
        <bs.BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
    );
};

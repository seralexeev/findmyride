import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import React, { FC, ReactNode, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ui } from '.';
import { createUseContext } from '../hooks/createUseContext';
import { useEvent } from '../hooks/useEvent';

type BottomSheetOptions = {
    bottomSafeArea?: boolean;
    position: number | string;
    children: (args: { close: () => void }) => ReactNode;
    onClose?: () => void;
    props?: Omit<BottomSheetProps, 'children' | 'snapPoints'>;
};

export const [useBottomSheet, Provider] = createUseContext<(args: BottomSheetOptions) => void>('BottomSheetProvider');

export const BottomSheetProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [sheets, setSheets] = useState<BottomSheetOptions[]>(() => []);

    const showBottomSheet = useEvent((sheet: BottomSheetOptions) => {
        setSheets((prev) => [...prev, sheet]);
    });

    return (
        <Provider value={showBottomSheet}>
            {children}
            {sheets.map((options, i) => (
                <BottomSheetWrapper
                    {...options}
                    onClose={() => {
                        setSheets((prev) => prev.filter((sheet) => sheet !== options));
                        options.onClose?.();
                    }}
                />
            ))}
        </Provider>
    );
};

const BottomSheetWrapper: FC<
    BottomSheetOptions & { onClose: () => void; props?: Omit<BottomSheetProps, 'children' | 'snapPoints'> }
> = ({ children, position, onClose, bottomSafeArea = true, props }) => {
    const [bottomSheetRef, bottomSheetProps] = ui.useBottomSheetHelper([position]);
    const { bottom } = useSafeAreaInsets();

    return (
        <BottomSheet
            ref={bottomSheetRef}
            {...bottomSheetProps}
            enablePanDownToClose
            index={0}
            onClose={onClose}
            backdropComponent={ui.BottomSheetBackdrop}
            {...props}
        >
            <ui.Box
                flex
                paddingBottom={bottomSafeArea ? `${bottom}px` : undefined}
                children={children({
                    close: () => bottomSheetRef.current?.close(),
                })}
            />
        </BottomSheet>
    );
};

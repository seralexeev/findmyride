import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import { uuid } from '@untype/toolbox';
import React, { FC, ReactNode, memo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ui } from '.';
import { createUseContext } from '../hooks/createUseContext';
import { useEvent } from '../hooks/useEvent';

type BottomSheetOptions = {
    id?: string;
    bottomSafeArea?: boolean;
    position: number | string;
    children: (args: { close: () => void }) => ReactNode;
    onClose?: () => void;
    props?: Omit<BottomSheetProps, 'children' | 'snapPoints'>;
};

export const [useBottomSheet, Provider] = createUseContext<(args: BottomSheetOptions) => void>('BottomSheetProvider');

export const BottomSheetProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [sheets, setSheets] = useState<Array<BottomSheetOptions & { id: string }>>(() => []);

    const showBottomSheet = useEvent(({ id = uuid.v4(), ...sheet }: BottomSheetOptions) => {
        setSheets((prev) => {
            const stack = [...prev];
            const index = prev.findIndex((x) => x.id === id);

            if (index === -1) {
                stack.push({ id, ...sheet });
            } else {
                stack[index] = { id, ...sheet };
            }

            return stack;
        });
    });

    const node = sheets.map((options) => (
        <BottomSheetWrapper
            key={options.id}
            {...options}
            onClose={() => {
                setSheets((prev) => prev.filter((sheet) => sheet.id !== options.id));
                options.onClose?.();
            }}
        />
    ));

    return (
        <Provider value={showBottomSheet}>
            <NodeProvider value={node} children={children} />
        </Provider>
    );
};

const [useBottomSheetNode, NodeProvider] = createUseContext<ReactNode>('BottomSheetNodeProvider');
export const BottomSheetNodeProvider: FC = memo(useBottomSheetNode);

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
                children={children({ close: () => bottomSheetRef.current?.close() })}
            />
        </BottomSheet>
    );
};

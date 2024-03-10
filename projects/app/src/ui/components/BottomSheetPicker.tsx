import { Picker } from '@react-native-picker/picker';
import React, { useRef, useState } from 'react';
import { ui } from '..';
import { useBottomSheet } from '../BottomSheetProvider';

export type BottomSheetPickerProps<T extends string | number> = {
    items: T[] | readonly T[];
    onChange?: (t: T) => void;
    value?: T | null;
    renderItem: (t: T, isSelected: boolean) => string;
    keySelector: (t: T) => string | number;
};

export const BottomSheetPicker = <T extends string | number>({
    items,
    value: initialValue,
    onChange,
    keySelector,
    renderItem,
}: BottomSheetPickerProps<T>) => {
    const [value, setValue] = useState<T | null>(initialValue ?? null);

    return (
        <Picker
            selectedValue={value}
            onValueChange={(_, itemIndex) => {
                const item = items[itemIndex];
                onChange?.(item!);
                setValue(item!);
            }}
            style={{ height: 200 }}
            children={items.map((x) => (
                <Picker.Item key={keySelector(x)} label={renderItem(x, value === x)} value={x} />
            ))}
        />
    );
};

export const useBottomSheetPicker = () => {
    const showBottomSheet = useBottomSheet();
    const ref = useRef<any>();

    return <T extends string | number>({ title, onChange, ...props }: BottomSheetPickerProps<T> & { title: string }) => {
        showBottomSheet({
            position: 420,
            children: ({ close }) => (
                <ui.Box padding={2} flex>
                    <ui.Box borderBottomWidth borderColor flexCenter>
                        <ui.Text variant='title2' center children={title} paddingBottom={2} />
                    </ui.Box>
                    <ui.Box paddingVertical flex>
                        <BottomSheetPicker {...props} onChange={(value) => (ref.current = value)} />
                    </ui.Box>
                    <ui.Box paddingHorizontal>
                        <ui.Button
                            children='Save'
                            color='primary'
                            size='large'
                            onPress={() => Promise.resolve(onChange?.(ref.current as any)).then(() => close())}
                        />
                    </ui.Box>
                </ui.Box>
            ),
        });
    };
};

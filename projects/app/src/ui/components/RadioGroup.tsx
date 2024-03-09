import React, { ReactNode } from 'react';
import { ui } from '..';
import { useTheme } from '../ThemeProvider';

export type RadioGroupProps<T> = {
    items: T[] | readonly T[];
    onChange?: (t: T) => void;
    value?: T | null;
    renderItem: (t: T, isSelected: boolean) => ReactNode;
    keySelector: (t: T) => string | number;
};

export const RadioGroup = <T,>(props: RadioGroupProps<T>) => {
    const { border, colors } = useTheme();

    const renderItem = (x: T, isSelected: boolean) => {
        const item = props.renderItem ? props.renderItem(x, isSelected) : String(x);
        return typeof item === 'string' ? <ui.Text children={item} semiBold /> : item;
    };

    const keySelector = props.keySelector ?? ((x: T) => String(x));

    return (
        <ui.Box>
            {props.items.map((x) => {
                const isSelected = props.value === x;
                const borderWidth = isSelected ? 8 : 6;
                const borderColor = isSelected ? colors.primary.background : border.color;

                return (
                    <ui.Pressable
                        key={keySelector(x)}
                        row
                        onPress={() => props.onChange?.(x)}
                        paddingVertical={1}
                        alignItems='center'
                    >
                        <ui.Box children={renderItem(x, isSelected)} flex />
                        <ui.Box flexCenter position='relative'>
                            <ui.Box wh={24} round borderWidth={borderWidth} borderColor={borderColor} flexCenter>
                                {isSelected && <ui.Box wh={12} bgPalette='primary' round />}
                            </ui.Box>
                        </ui.Box>
                    </ui.Pressable>
                );
            })}
        </ui.Box>
    );
};

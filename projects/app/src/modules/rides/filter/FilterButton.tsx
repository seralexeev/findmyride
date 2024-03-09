import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { useTheme } from '../../../ui/ThemeProvider';

type FilterButtonProps = { isActive: boolean } & ui.PressableProps;

export const FilterButton: FC<FilterButtonProps> = memo(({ isActive, ...rest }) => {
    const { border } = useTheme();
    const color = isActive ? 'tertiary' : 'transparent';

    return (
        <ui.Pressable
            row
            padding
            round
            bgPalette={color}
            flexCenter
            haptic
            borderWidth
            borderColor={isActive ? 'transparent' : border.color}
            {...rest}
        />
    );
});

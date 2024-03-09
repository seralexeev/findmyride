import React, { FC, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { ui } from '..';
import { useTheme } from '../ThemeProvider';

export type DividerProps = ui.BoxProps & {
    children?: ReactNode;
    color?: string;
};

export const Divider: FC<DividerProps> = ({ children, color, ...props }) => {
    const { border } = useTheme();

    return (
        <ui.Box row alignItems='center' {...props}>
            <ui.Box height={StyleSheet.hairlineWidth} backgroundColor={color ?? border.color} flexGrow={1} />
            {children && <ui.Text variant='caption' children={children} paddingHorizontal />}
            <ui.Box height={StyleSheet.hairlineWidth} backgroundColor={color ?? border.color} flexGrow={1} />
        </ui.Box>
    );
};

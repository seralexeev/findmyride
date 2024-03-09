import React, { FC } from 'react';
import { Switch } from 'react-native';
import { useTheme } from '../ThemeProvider';

export type SwitcherProps = {
    onChange: (value: boolean) => void;
    value?: boolean | null;
};

export const Switcher: FC<SwitcherProps> = ({ onChange, value }) => {
    const { colors } = useTheme();

    return (
        <Switch
            trackColor={{ false: '#fff', true: colors.primary.background }}
            onValueChange={onChange}
            value={Boolean(value)}
        />
    );
};

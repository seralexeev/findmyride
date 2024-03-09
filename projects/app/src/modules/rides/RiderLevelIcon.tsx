import { RiderLevel } from '@findmyride/api';
import React, { FC } from 'react';
import { icons, ui } from '../../ui';
import { useTheme } from '../../ui/ThemeProvider';
import { Theme } from '../../ui/theme';

type RiderLevelIconProps = {
    level: RiderLevel;
    size: number;
};

const aspect = 18 / 30;
const getWidth = (height: number) => aspect * height;

export const RiderLevelIcon: FC<RiderLevelIconProps> = ({ size = 10, level }) => {
    const width = getWidth(size);
    const config = useTheme();
    const colors = getColors(config, level);

    return (
        <ui.Box row>
            {colors.map((x, i) => (
                <icons.LevelChevron key={i} height={size} width={width} fill={x} />
            ))}
        </ui.Box>
    );
};

const getColors = (config: Theme, level: RiderLevel) => {
    const active = config.colors.primary.background;
    const nonActive = config.border.color;

    switch (level) {
        case 'beginner':
            return [active, nonActive, nonActive];
        case 'intermediate':
            return [active, active, nonActive];
        case 'pro':
            return [active, active, active];
        default:
            return [nonActive, nonActive, nonActive];
    }
};

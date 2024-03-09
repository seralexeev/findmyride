import { BikeType } from '@findmyride/api';
import React, { ComponentType, FC } from 'react';
import { SvgProps } from 'react-native-svg';
import { icons } from '../../ui';
import { useTheme } from '../../ui/ThemeProvider';

type BikeTypeIconProps = {
    type: BikeType;
    size?: number;
    active?: boolean;
};

export const BikeTypeIcon: FC<BikeTypeIconProps> = ({ type, size = 14, active }) => {
    const Icon = getBikeTypeIcon(type);
    const { colors } = useTheme();

    return <Icon width={size} height={size} fill={active ? colors.primary.background : colors.secondary.background} />;
};

export const getBikeTypeTitle = (type: BikeType) => {
    switch (type) {
        case 'gravel':
            return 'Gravel';
        case 'mtb':
            return 'MTB';
        case 'road':
            return 'Road';
        default:
            return 'Unknown';
    }
};

export const getBikeTypeIcon = (type: BikeType): ComponentType<SvgProps> => {
    switch (type) {
        case 'gravel':
            return icons.BikeTypeGravel;
        case 'mtb':
            return icons.BikeTypeMtb;
        case 'road':
            return icons.BikeTypeRoad;
        default:
            return icons.BikeTypeRoad;
    }
};

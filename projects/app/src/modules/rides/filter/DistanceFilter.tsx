import { formatDistanceMeters } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { FilterButton } from './FilterButton';
import { RideFilterProps } from './RideFilter';
import { RideFilterSection } from './RideFilterSection';

const distances: Array<[number, number]> = [
    [0, 5000],
    [5000, 10000],
    [10000, 15000],
    [15000, 20000],
    [20000, 50000],
    [50000, 100000],
    [100000, 200000],
    [200000, 99999999],
];

export const DistanceFilter: FC<RideFilterProps> = memo(({ filter, setFilter }) => {
    return (
        <RideFilterSection title='Distance'>
            {distances.map((distance, i) => {
                const isActive = filter.distance === distance;
                const children = `${formatDistanceMeters(distance[0])} - ${distance[1] === 99999999 ? '∞' : formatDistanceMeters(distance[1])}`;

                return (
                    <FilterButton
                        key={i}
                        paddingHorizontal={3}
                        isActive={isActive}
                        onPress={() => setFilter((prev) => ({ ...prev, distance: isActive ? null : distance }))}
                    >
                        <ui.Text children={children} variant='body2' flex semiBold />
                    </FilterButton>
                );
            })}
        </RideFilterSection>
    );
});

import { formatDistanceMeters } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { useGeoLocation } from '../../map/GeoLocationProvider';
import { FilterButton } from './FilterButton';
import { RideFilterProps } from './RideFilter';
import { RideFilterSection } from './RideFilterSection';

const distances = [5000, 10000, 25000, 50000, 100000];

export const DistanceToStartFilter: FC<RideFilterProps> = memo(({ filter, setFilter }) => {
    const { requestPermission } = useGeoLocation();

    return (
        <RideFilterSection title='Distance to Start'>
            {distances.map((distanceToStart) => {
                const isActive = filter.distanceToStart === distanceToStart;

                const onPress = () => {
                    return requestPermission().then(() =>
                        setFilter((prev) => ({ ...prev, distanceToStart: isActive ? null : distanceToStart })),
                    );
                };

                return (
                    <FilterButton key={distanceToStart} paddingHorizontal={3} isActive={isActive} onPress={onPress}>
                        <ui.Text children={`< ${formatDistanceMeters(distanceToStart)}`} variant='body2' flex semiBold />
                    </FilterButton>
                );
            })}
        </RideFilterSection>
    );
});

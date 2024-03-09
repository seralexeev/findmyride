import { BikeType } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { BikeTypeIcon, getBikeTypeTitle } from '../BikeTypeIcon';
import { FilterButton } from './FilterButton';
import { RideFilterProps } from './RideFilter';
import { RideFilterSection } from './RideFilterSection';

export const BikeTypeFilter: FC<RideFilterProps> = memo(({ filter, setFilter }) => {
    return (
        <RideFilterSection title='Bike Type'>
            {BikeType.options.map(({ value }) => {
                const isActive = filter.bikeType === value;

                return (
                    <FilterButton
                        key={value}
                        paddingHorizontal={2}
                        isActive={filter.bikeType === value}
                        onPress={() => setFilter((prev) => ({ ...prev, bikeType: isActive ? null : value }))}
                    >
                        <BikeTypeIcon type={value} size={10} />
                        <ui.Text marginLeft={2} children={getBikeTypeTitle(value)} variant='body2' flex semiBold />
                    </FilterButton>
                );
            })}
        </RideFilterSection>
    );
});

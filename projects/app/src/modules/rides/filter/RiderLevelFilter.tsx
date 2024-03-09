import { RiderLevel } from '@findmyride/api';
import { capitalCase } from 'change-case';
import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { RiderLevelIcon } from '../RiderLevelIcon';
import { FilterButton } from './FilterButton';
import { RideFilterProps } from './RideFilter';
import { RideFilterSection } from './RideFilterSection';

export const RiderLevelFilter: FC<RideFilterProps> = memo(({ filter, setFilter }) => {
    return (
        <RideFilterSection title='Rider Level'>
            {RiderLevel.options.map(({ value }) => {
                const isActive = filter.riderLevel === value;

                return (
                    <FilterButton
                        key={value}
                        paddingHorizontal={2}
                        isActive={isActive}
                        onPress={() => setFilter((prev) => ({ ...prev, riderLevel: isActive ? null : value }))}
                    >
                        <RiderLevelIcon level={value} size={10} />
                        <ui.Text marginLeft={2} children={capitalCase(value)} variant='body2' flex semiBold />
                    </FilterButton>
                );
            })}
        </RideFilterSection>
    );
});

import React, { FC, memo } from 'react';
import { icons, ui } from '../../../ui';
import { FilterButton } from './FilterButton';
import { RideFilterProps } from './RideFilter';
import { RideFilterSection } from './RideFilterSection';

export const RideOptionsFilter: FC<RideFilterProps> = memo(({ filter, setFilter }) => {
    return (
        <RideFilterSection title='Options'>
            <FilterButton
                paddingHorizontal={3}
                isActive={Boolean(filter.publicOnly)}
                onPress={() => setFilter((prev) => ({ ...prev, publicOnly: !prev.publicOnly }))}
            >
                <ui.Text children='Anyone Can Join' variant='body2' flex semiBold />
            </FilterButton>
            <FilterButton
                paddingHorizontal={2}
                isActive={Boolean(filter.followsOnly)}
                onPress={() => setFilter((prev) => ({ ...prev, followsOnly: !prev.followsOnly }))}
            >
                <icons.Profile width={14} height={14} fill='#000' />
                <ui.Text marginLeft={2} children='People I Follow' variant='body2' flex semiBold />
            </FilterButton>
        </RideFilterSection>
    );
});

import { RpcInput } from '@findmyride/api';
import React, { Dispatch, FC, SetStateAction, useState } from 'react';
import { ui } from '../../../ui';
import { BikeTypeFilter } from './BikeTypeFilter';
import { DistanceFilter } from './DistanceFilter';
import { DistanceToStartFilter } from './DistanceToStartFilter';
import { RideOptionsFilter } from './RideOptionsFilter';
import { RiderLevelFilter } from './RiderLevelFilter';

export type RideFilterProps = {
    setFilter: Dispatch<SetStateAction<RideFilterType>>;
    filter: RideFilterType;
};

export type RideFilterType = RpcInput<'ride/find'>['filter'];

export const RideFilter: FC<RideFilterProps> = ({ filter, setFilter }) => {
    return (
        <ui.Stack paddingVertical spacing>
            <RiderLevelFilter filter={filter} setFilter={setFilter} />
            <BikeTypeFilter filter={filter} setFilter={setFilter} />
            <DistanceFilter filter={filter} setFilter={setFilter} />
            <DistanceToStartFilter filter={filter} setFilter={setFilter} />
            <RideOptionsFilter filter={filter} setFilter={setFilter} />
        </ui.Stack>
    );
};

const defaultFilter: RideFilterType = {
    status: 'created',
    // fromDate: new Date(),
    // distanceToStart: 50000,
};

const hiddenKeys = {
    status: true,
    fromDate: true,
};

export const useRidesFilter = () => {
    const [filter, setFilter] = useState<RpcInput<'ride/find'>['filter']>(defaultFilter);
    const clearFilter = () => setFilter(defaultFilter);

    return {
        filter,
        setFilter,
        clearFilter,
        isActive: Object.entries(filter).some(([key, value]) => !(key in hiddenKeys) && value),
    };
};

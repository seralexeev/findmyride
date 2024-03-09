import { RpcInput } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../ui';
import { RidesList } from './RidesList';

type FilteredRidesScreenProps = {
    title: string;
    filter: RpcInput<'ride/find'>['filter'];
};

export const FilteredRidesScreen: FC<FilteredRidesScreenProps> = memo(({ title, filter }) => {
    return (
        <ui.Screen header={title} white bottomSafeArea={false} name='FilteredRidesScreen'>
            <ui.Box flex backgroundColor>
                <RidesList filter={filter} />
            </ui.Box>
        </ui.Screen>
    );
});

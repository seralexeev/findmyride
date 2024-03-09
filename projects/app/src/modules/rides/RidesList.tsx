import React, { ComponentType, FC, ReactElement, memo } from 'react';
import { RpcFlatList } from '../../api/RpcFlatList';
import { ui } from '../../ui';
import { UserMediaCard } from '../user/UserMediaCard';
import { RideCard } from './RideCard';
import { RiderLevelIcon } from './RiderLevelIcon';
import { RideFilterProps } from './filter/RideFilter';

type RidesListProps = Omit<RideFilterProps, 'setFilter'> & {
    paddingBottom?: ui.BoxProps['paddingBottom'];
    ListHeaderComponent?: ComponentType<any> | ReactElement | null;
    onRefresh?: () => void;
};

export const RidesList: FC<RidesListProps> = memo(({ filter, onRefresh, paddingBottom, ListHeaderComponent }) => {
    return (
        <RpcFlatList
            endpoint='ride/find'
            renderItem={({ item }) =>
                item.type === 'ride' ? (
                    <RideCard ride={item.ride} />
                ) : (
                    <ui.Box borderRadius backgroundColor='#fff' borderColor borderWidth overflowHidden padding>
                        <UserMediaCard
                            user={item.user}
                            navigateByName
                            aux={
                                <ui.Box flexCenter paddingTop paddingRight>
                                    <RiderLevelIcon level={item.user.level} size={12} />
                                    <ui.Text variant='caption' marginTop='5px' children='Level' />
                                </ui.Box>
                            }
                        />
                    </ui.Box>
                )
            }
            payload={{ filter }}
            keyExtractor={(x, query) => `${x.id}-${query.dataUpdatedAt}`}
            paddingHorizontal={2}
            paddingVertical={2}
            ItemSeparatorComponent={ui.BoxSeparator[2]}
            ListHeaderComponent={ListHeaderComponent}
            empty={`There are no rides yet.\nBut you can fix it creating your own.`}
            paddingBottom={paddingBottom}
            onRefresh={onRefresh}
        />
    );
});

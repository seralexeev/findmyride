import { RpcItemsOutput, RpcOutput } from '@findmyride/api';
import React, { FC, Fragment, memo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useRpcFlatListProps } from '../../../api/RpcFlatList';
import { icons, ui } from '../../../ui';
import { useScreen } from '../../../ui/ScreenProvider';
import { ParticipantRow } from './ParticipantRow';
import { ParticipantsCounts } from './ParticipantsCounts';

type ParticipatesListProps = {
    ride: RpcOutput<'ride/get'>;
};

export const ParticipatesList: FC<ParticipatesListProps> = memo(({ ride }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500, { leading: true });
    const { showScreen } = useScreen();
    const [flatListProps, itemsQUery] = useRpcFlatListProps(
        'ride_ops/find_participants',
        { rideId: ride.id, query: debouncedQuery },
        (x) => x.user.id,
    );

    return (
        <ui.Box flex>
            {ride.isEditable && (
                <Fragment>
                    <ui.Box padding row alignItems='center'>
                        <ui.Box flex marginRight>
                            <ui.Input
                                loading={itemsQUery.isFetching}
                                value={query}
                                onChangeText={setQuery}
                                color='tertiary'
                                StartIcon={icons.Search}
                                placeholder='Search'
                            />
                        </ui.Box>
                        <ui.Button
                            StartIcon={icons.Plus}
                            children='Invite'
                            width={100}
                            onPress={() => showScreen({ children: <InviteScreen ride={ride} /> })}
                        />
                    </ui.Box>
                    <ui.Divider />
                </Fragment>
            )}
            {itemsQUery.isSuccess ? (
                <ui.BottomSheetFlatList<RpcItemsOutput<'ride_ops/find_participants'>>
                    {...flatListProps}
                    keyExtractor={(x) => x.user.id}
                    ListHeaderComponent={
                        <Fragment>
                            <ui.Box padding>
                                <ParticipantsCounts ride={ride} />
                            </ui.Box>
                            <ui.Divider marginBottom />
                        </Fragment>
                    }
                    ListEmptyComponent={<ui.Empty children='There are no Riders in the Ride' height={500} />}
                    renderItem={({ item }) => (
                        <ui.Box paddingLeft={2}>
                            <ParticipantRow item={item} ride={ride} />
                        </ui.Box>
                    )}
                    ItemSeparatorComponent={() => <ui.Divider marginVertical={0.5} marginLeft='64px' />}
                    paddingBottom={10}
                />
            ) : (
                <ui.FetchFallback query={itemsQUery} spinner />
            )}
        </ui.Box>
    );
});

export const InviteScreen: FC<ParticipatesListProps> = memo(({ ride }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500, { leading: true });
    const [flatListProps, itemsQuery] = useRpcFlatListProps(
        'ride_ops/find_participants',
        {
            rideId: ride.id,
            query: debouncedQuery,
            friends: true,
        },
        (x) => x.user.id,
    );

    return (
        <ui.Screen name='InviteScreen' header='Invite' white bottomSafeArea={false}>
            <ui.Box padding>
                <ui.Input
                    value={query}
                    onChangeText={setQuery}
                    color='tertiary'
                    StartIcon={icons.Search}
                    loading={itemsQuery.isRefetching}
                    placeholder='Invite others to join the ride'
                />
            </ui.Box>
            {itemsQuery.isSuccess ? (
                <ui.FlatList<RpcItemsOutput<'ride_ops/find_participants'>>
                    {...flatListProps}
                    keyExtractor={(x) => `${x.user.id}-${itemsQuery.dataUpdatedAt}`}
                    ListEmptyComponent={
                        <ui.Empty height={500} children={`We couldn't find any cyclists.\nTry using different keywords.`} />
                    }
                    renderItem={({ item }) => (
                        <ui.Box paddingLeft={2}>
                            <ParticipantRow item={item} ride={ride} />
                        </ui.Box>
                    )}
                    ItemSeparatorComponent={() => <ui.Divider marginVertical={0.5} marginLeft='64px' />}
                    padding
                    paddingBottom={10}
                />
            ) : (
                <ui.FetchFallback query={itemsQuery} spinner />
            )}
        </ui.Screen>
    );
});

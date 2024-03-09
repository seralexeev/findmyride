import { RpcItemsOutput } from '@findmyride/api';
import dedent from 'dedent';
import React, { FC, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useRpcFlatListProps } from '../../api/RpcFlatList';
import { icons, ui } from '../../ui';
import { UserListItem } from './UserListItem';

type FollowingsScreenProps = {
    userId: string;
    direction: 'followedBy' | 'following';
};

export const FollowingsScreen: FC<FollowingsScreenProps> = ({ userId, direction }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500, { leading: true });
    const [flatListProps, itemsQuery] = useRpcFlatListProps(
        'social/find_friends',
        {
            userId,
            query: debouncedQuery,
            direction,
        },
        (x) => x.user.id,
    );

    return (
        <ui.Screen
            name='FollowingsScreen'
            header={direction === 'followedBy' ? 'Followers' : 'Following'}
            white
            bottomSafeArea={false}
        >
            <ui.Box padding>
                <ui.Input
                    value={query}
                    onChangeText={setQuery}
                    color='tertiary'
                    StartIcon={icons.Search}
                    loading={itemsQuery.isRefetching}
                />
            </ui.Box>
            {itemsQuery.isSuccess ? (
                <ui.FlatList<RpcItemsOutput<'social/find_friends'>>
                    {...flatListProps}
                    keyExtractor={(x) => `${x.user.id}-${itemsQuery.dataUpdatedAt}`}
                    ListEmptyComponent={
                        <ui.Empty
                            height={500}
                            children={dedent`
                                We couldn't find any cyclists.
                                Try using different keywords.
                            `}
                        />
                    }
                    renderItem={({ item }) => <UserListItem item={item} />}
                    ItemSeparatorComponent={() => <ui.Divider marginVertical={0.5} marginLeft='64px' />}
                    padding
                    paddingBottom={10}
                />
            ) : (
                <ui.FetchFallback query={itemsQuery} spinner />
            )}
        </ui.Screen>
    );
};

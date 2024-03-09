import { RpcItemsOutput } from '@findmyride/api';
import dedent from 'dedent';
import React, { FC, memo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useRpcFlatListProps } from '../../api/RpcFlatList';
import { ui } from '../../ui';
import { UserListItem } from './UserListItem';

export const SearchUsersScreen: FC = memo(() => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500, { leading: true });
    const [flatListProps, findParticipantQuery] = useRpcFlatListProps(
        'social/find_users',
        { query: debouncedQuery },
        (x) => x.user.id,
    );

    return (
        <ui.Screen name='SearchUsersList' header='Search for cyclists' white bottomSafeArea={false}>
            <ui.Box padding>
                <ui.Input
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    color='tertiary'
                    StartIcon={icons.Search}
                    loading={findParticipantQuery.isRefetching}
                />
            </ui.Box>
            {findParticipantQuery.isSuccess ? (
                <ui.FlatList<RpcItemsOutput<'social/find_users'>>
                    {...flatListProps}
                    keyExtractor={(x) => `${x.user.id}-${findParticipantQuery.dataUpdatedAt}`}
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
                    scrollBorder
                />
            ) : (
                <ui.FetchFallback query={findParticipantQuery} spinner />
            )}
        </ui.Screen>
    );
});

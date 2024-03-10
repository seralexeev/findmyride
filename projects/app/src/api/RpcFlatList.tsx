import { ExpectedEndpoint, RpcInput, RpcItemsOutput, RpcOutput } from '@findmyride/api';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';
import { UseInfiniteQueryResult, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { array } from '@untype/toolbox';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { ListRenderItem } from 'react-native';
import { ui } from '../ui';
import { withStyler } from '../ui/styler';
import { paddingStyler } from '../ui/styler/viewStyler';
import { useRemoveQuery, useRpc } from './rpc';

type ListEndpoint = ExpectedEndpoint<{ page: number }, { items: any[]; hasMore: boolean }>;

export const useRpcFlatList = <TEndpoint extends ListEndpoint>(
    endpoint: TEndpoint,
    payload: Omit<RpcInput<TEndpoint>, 'page'>,
    keySelector: (item: RpcItemsOutput<TEndpoint>, query: UseInfiniteQueryResult) => unknown,
    options?: {
        onRefresh?: (() => void) | null;
    },
) => {
    const removeQuery = useRemoveQuery();
    const request = useRpc(endpoint).useRequest();
    const query = useInfiniteQuery({
        initialPageParam: 1,
        queryKey: [endpoint, payload],
        queryFn: async ({ pageParam = 1 }) => {
            const result = (await request({ ...payload, page: pageParam } as any)) as RpcOutput<ListEndpoint>;

            return {
                result,
                nextPage: result.hasMore ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        placeholderData: keepPreviousData,
    });

    useEffect(() => void removeQuery([endpoint]), []);
    const refreshControl = ui.useRefreshControl(() => {
        removeQuery([endpoint]);

        if (options?.onRefresh) {
            options.onRefresh();
        }
    });

    const loadNext = () => {
        if (!query.hasNextPage || query.isFetchingNextPage) {
            return;
        }

        return query.fetchNextPage();
    };

    const items = useMemo(() => {
        return query.isSuccess
            ? array.uniqueBy(
                  query.data.pages.flatMap((x) => x.result.items as Array<RpcItemsOutput<TEndpoint>>),
                  (x) => keySelector(x, query),
              )
            : [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return {
        query,
        loadNext,
        refreshControl,
        items,
    };
};

export const useRpcFlatListProps = <TEndpoint extends ListEndpoint>(
    endpoint: TEndpoint,
    payload: Omit<RpcInput<TEndpoint>, 'page'>,
    keySelector: (item: RpcItemsOutput<TEndpoint>, query: UseInfiniteQueryResult) => unknown,
    options?: {
        onRefresh?: (() => void) | null;
    },
) => {
    const { items, query, loadNext, refreshControl } = useRpcFlatList(endpoint, payload, keySelector, options);

    const props = {
        data: items,
        refreshing: refreshControl.refreshing,
        refreshControl,
        onEndReachedThreshold: 0.7,
        onEndReached: loadNext,
        ListFooterComponent: query.isFetchingNextPage ? (
            <ui.Box flexCenter marginTop={2}>
                <ui.Spinner />
            </ui.Box>
        ) : null,
    };

    return [props, query] as const;
};

type RpcFlatListProps<TEndpoint extends ListEndpoint> = Omit<
    ui.FlatListProps<RpcItemsOutput<TEndpoint>>,
    | 'renderItem'
    | 'data'
    | 'keyExtractor'
    | 'refreshing'
    | 'refreshControl'
    | 'ListEmptyComponent'
    | 'onEndReached'
    | 'ListFooterComponent'
> & {
    endpoint: TEndpoint;
    renderItem: ListRenderItem<RpcItemsOutput<TEndpoint>> | null | undefined;
    payload: Omit<RpcInput<TEndpoint>, 'page'>;
    empty?: ReactNode;
    keyExtractor: (item: RpcItemsOutput<TEndpoint>, query: UseInfiniteQueryResult) => string;
};

export const RpcFlatList = function RpcFlatList<TEndpoint extends ListEndpoint>({
    renderItem,
    payload,
    empty,
    endpoint,
    keyExtractor,
    onEndReachedThreshold = 0.7,
    onRefresh,
    ...props
}: RpcFlatListProps<TEndpoint>) {
    const [rpcProps, query] = useRpcFlatListProps(endpoint, payload, keyExtractor, { onRefresh });

    return query.isSuccess ? (
        <ui.FlatList
            {...props}
            {...rpcProps}
            renderItem={renderItem}
            keyExtractor={(x) => keyExtractor(x, query)}
            ListEmptyComponent={(typeof empty === 'string' ? <ui.Empty children={empty} height={500} /> : empty) as any}
            onEndReachedThreshold={onEndReachedThreshold}
        />
    ) : (
        <ui.FetchFallback query={query} spinner />
    );
};

const BottomSheetRpcFlatListImpl = function RpcFlatList<TEndpoint extends ListEndpoint>({
    renderItem,
    payload,
    empty,
    endpoint,
    keyExtractor,
    onEndReachedThreshold = 0.7,
    ...props
}: RpcFlatListProps<TEndpoint>) {
    const [rpcProps, query] = useRpcFlatListProps(endpoint, payload, keyExtractor);

    return query.isSuccess ? (
        <BottomSheetVirtualizedList
            {...props}
            {...rpcProps}
            renderItem={renderItem}
            keyExtractor={(x) => keyExtractor(x, query)}
            ListEmptyComponent={(typeof empty === 'string' ? <ui.Empty children={empty} height={500} /> : empty) as any}
            onEndReachedThreshold={onEndReachedThreshold}
            getItemCount={(data) => data.length}
            getItem={(data, index) => data[index]}
            keyboardShouldPersistTaps='always'
        />
    ) : (
        <ui.FetchFallback query={query} spinner />
    );
};

export const BottomSheetRpcFlatList = withStyler(paddingStyler)(
    <TEndpoint extends ListEndpoint>({ style, ...props }: RpcFlatListProps<TEndpoint>) => {
        return <BottomSheetRpcFlatListImpl {...props} contentContainerStyle={style} />;
    },
) as any as typeof BottomSheetRpcFlatListImpl;

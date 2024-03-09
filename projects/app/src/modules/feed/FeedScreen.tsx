import { ParticipantStatus, RidePreviewVm, RpcItemsOutput } from '@findmyride/api';
import { assert } from '@untype/toolbox';
import { formatDistanceToNow } from 'date-fns';
import React, { FC, Fragment, VFC, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { useRpcFlatListProps } from '../../api/RpcFlatList';
import { ui } from '../../ui';
import { RideCard } from '../rides/RideCard';
import { useRideImagesScreen } from '../rides/view/RideImageScreen';
import { UserListItem } from '../user/UserListItem';
import { UserMediaCard } from '../user/UserMediaCard';

export const FeedScreen: VFC = () => {
    const [flatListProps, itemsQUery] = useRpcFlatListProps('social/get_feed', { type: 'dummy' }, (x) => `${x.type}-${x.date}`);

    return (
        <ui.Screen backgroundColor name='FeedScreen' bottomSafeArea={false} header='Events'>
            {itemsQUery.isSuccess ? (
                <ui.FlatList<RpcItemsOutput<'social/get_feed'>>
                    {...flatListProps}
                    keyExtractor={(x, i) => `${x.type}-${x.date}-${i}`}
                    ListEmptyComponent={<ui.Empty children='No Events' height={500} />}
                    renderItem={({ item }) => <GenericEvent event={item} />}
                    ItemSeparatorComponent={ui.BoxSeparator[2]}
                    paddingBottom={10}
                    paddingTop={2}
                />
            ) : (
                <ui.FetchFallback query={itemsQUery} spinner />
            )}
        </ui.Screen>
    );
};

type SocialEvent = RpcItemsOutput<'social/get_feed'>;
type EventByType<T extends SocialEvent['type']> = Extract<SocialEvent, { type: T }>;

const GenericEvent: FC<{ event: SocialEvent }> = ({ event }) => {
    switch (event.type) {
        case 'ride_image':
            return <RideImagesEvent event={event} />;
        case 'follow':
            return <FollowEvent event={event} />;
        case 'friend_ride':
            return <RidesListEvent event={event} title='Rides of your friends' />;
        case 'ride_nearby':
            return <RidesListEvent event={event} title='New rides nearby' />;
        case 'ride_status':
            return <RideStatusEvent event={event} />;

        default:
            return null;
    }
};

const RideImagesEvent: FC<{ event: EventByType<'ride_image'> }> = ({ event: { data, date } }) => {
    const openImage = useRideImagesScreen();

    return (
        <ui.Box marginHorizontal={2}>
            <ui.Text variant='body2' semiBold children={`${data.user.name} has shared some ride photos`} marginBottom={0.5} />
            <ui.Box white borderRadius overflowHidden borderColor borderWidth>
                <ui.Box padding borderBottomWidth borderColor>
                    <UserMediaCard user={data.user} subtitle={`${formatDistanceToNow(new Date(date))} ago`} />
                </ui.Box>
                <ui.Box row flex flexWrap>
                    {data.images.map((x) => (
                        <ui.Box width='25%' key={x.id} onPress={() => openImage(x, data.images)}>
                            <ui.FileImage image={x.file} resizeMode='cover' aspectRatio={1} />
                        </ui.Box>
                    ))}
                </ui.Box>
            </ui.Box>
        </ui.Box>
    );
};

const FollowEvent: FC<{ event: EventByType<'follow'> }> = ({ event: { data } }) => {
    return (
        <ui.Box borderWidth borderColor paddingLeft={2} white>
            <ui.Box padding borderRadius overflowHidden>
                {data.users.map((x, i, ar) => (
                    <Fragment key={x.user.id}>
                        <UserListItem item={x} />
                        {i < ar.length - 1 && <ui.Divider marginVertical={0.5} marginLeft='64px' />}
                    </Fragment>
                ))}
            </ui.Box>
        </ui.Box>
    );
};

const RidesListEvent: FC<{ event: { data: { rides: RidePreviewVm[] } }; title: string }> = ({ event: { data }, title }) => {
    const { width } = useWindowDimensions();
    const [index, setIndex] = useState(0);

    return (
        <Fragment>
            <ui.Text variant='body2' semiBold children={title} marginBottom={0.5} marginHorizontal={2} />
            <Carousel
                data={data.rides}
                renderItem={({ item }) => (
                    <ui.Box paddingHorizontal={2}>
                        <RideCard ride={item} />
                    </ui.Box>
                )}
                sliderWidth={width}
                itemWidth={width}
                onSnapToItem={setIndex}
                inactiveSlideScale={1}
                scrollEnabled={data.rides.length > 1}
            />

            {data.rides.length > 1 ? (
                <Pagination
                    containerStyle={{ paddingVertical: 0, paddingTop: 16 }}
                    dotsLength={data.rides.length}
                    activeDotIndex={index}
                    inactiveDotOpacity={0.4}
                    inactiveDotScale={0.6}
                    dotContainerStyle={{ padding: 0, margin: 0 }}
                    dotStyle={{ marginHorizontal: -8 }}
                />
            ) : (
                <ui.Box height={16} />
            )}
        </Fragment>
    );
};

const RideStatusEvent: FC<{ event: EventByType<'ride_status'> }> = ({ event: { data } }) => {
    const caption = getRideEventCaption(data.status);
    return (
        <ui.Box marginHorizontal={2}>
            {typeof caption === 'string' ? (
                <ui.Text variant='body2' semiBold children={getRideEventCaption(data.status)} marginBottom={0.5} />
            ) : (
                caption
            )}
            <RideCard ride={data.ride} compact />
        </ui.Box>
    );
};

const getRideEventCaption = (status: ParticipantStatus) => {
    switch (status) {
        case 'approved':
            return 'You have joined the ride';
        case 'declined':
            return `Unfortunately, you can't join the ride`;
        case 'invited':
            return 'You have been invited to the ride';
        case 'left':
            return 'You have left the ride';
        case 'refused':
            return 'You have declined the invitation';
        case 'pending':
            return 'You are in the waiting list';
        default:
            return assert.never(status, '');
    }
};

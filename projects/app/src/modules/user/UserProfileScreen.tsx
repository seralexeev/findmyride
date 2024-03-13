import { RpcInput, formatSlug } from '@findmyride/api';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { keepPreviousData } from '@tanstack/react-query';
import { assert } from '@untype/toolbox';
import React, { FC, memo, useCallback } from 'react';
import { useInvalidate, useRpc } from '../../api/rpc';
import { useConfig } from '../../config/ConfigProvider';
import { useEvent } from '../../hooks/useEvent';
import { useTabNavigatorInset } from '../../hooks/useTabNavigatorInset';
import { icons, ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { ChatRoom } from '../chat/ChatRoom';
import { InteractiveMap, UserMarker } from '../map/InteractiveMap';
import { FilteredRidesScreen } from '../rides/FilteredRidesScreen';
import { RideCard } from '../rides/RideCard';
import { RiderLevelIcon } from '../rides/RiderLevelIcon';
import { useShareScreen } from '../share/ShareScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { FollowingsScreen } from './FollowingsScreen';
import { HelpScreen } from './HelpScreen';
import { useProfile } from './ProfileProvider';
import { UserAvatar } from './UserAvatar';
import { UserImages } from './UserImages';

export const CurrentProfileScreen = memo(() => {
    const { profile, refetch } = useProfile();
    const { showScreen } = useScreen();
    useFocusEffect(useEvent(() => void refetch()));

    return (
        <ui.Screen name='CurrentProfileScreen' white paddingTop>
            <ui.Box flex>
                <ui.Box paddingHorizontal={2} row justifyContent='space-between' alignItems='center'>
                    <ui.Box row justifyContent='space-between' alignItems='center' marginBottom>
                        <ui.Text variant='title1' children='Profile' />
                    </ui.Box>
                    <ui.Button
                        StartIcon={icons.Question}
                        color='transparent'
                        size='large'
                        onPress={() => showScreen({ children: <HelpScreen /> })}
                    />
                </ui.Box>

                <UserProfileView id={profile.id} />
            </ui.Box>
        </ui.Screen>
    );
});

export const UserProfileScreen: FC<{ id: string }> = ({ id }) => {
    return (
        <ui.Screen name='UserProfileScreen' header='Rider' white bottomSafeArea={false}>
            <UserProfileView id={id} />
        </ui.Screen>
    );
};

export const UserProfileRouteScreen: FC = memo(() => {
    const route = useRoute<any>();

    return <UserProfileScreen id={route.params.id} />;
});

const UserProfileView: FC<{ id: string }> = memo(({ id }) => {
    const { maxPaddingBottom } = useTabNavigatorInset();
    const config = useConfig();
    const { profile } = useProfile();
    const { showScreen } = useScreen();
    const userQuery = useRpc('social/get_user_info').useQuery({ input: { id } });
    const [mutateAsync] = useRpc('social/change_friendship_status').useMutation();
    const [getUserRoom] = useRpc('chat/get_user_room').useMutation();
    const invalidate = useInvalidate();
    // TODO: refetch all queries
    // const refreshControl = ui.useRefreshControl(userQuery.refetch);
    const share = useShareScreen();

    if (!userQuery.isSuccess) {
        return <ui.FetchFallback query={userQuery} spinner />;
    }

    const user = userQuery.data;
    const isCurrent = profile.id === user.id;

    const getMainButton = () => {
        if (isCurrent) {
            return (
                <ui.Button
                    color='tertiary'
                    onPress={() => showScreen({ children: <EditProfileScreen /> })}
                    children='Edit Profile'
                />
            );
        }

        const changeFriendshipStatus = (action: RpcInput<'social/change_friendship_status'>['action']) => {
            return mutateAsync({ action, userId: user.id }).then(() => invalidate(['social/get_user_info']));
        };

        if (user.friendshipStatus.following) {
            return <ui.Button color='light' onPress={() => changeFriendshipStatus('unfollow')} children='Following' />;
        } else {
            return (
                <ui.Button
                    color='primary'
                    onPress={() => changeFriendshipStatus('follow')}
                    children={user.friendshipStatus.followedBy ? 'Follow Back' : 'Follow'}
                />
            );
        }
    };

    const showFriends = (direction: 'followedBy' | 'following') => {
        showScreen({
            children: <FollowingsScreen direction={direction} userId={user.id} />,
        });
    };

    return (
        <ui.ScrollView paddingTop={isCurrent ? 0 : 2} flexGrow scrollBorder={isCurrent}>
            <ui.Box paddingHorizontal={2}>
                <ui.Box row marginBottom={2}>
                    <ui.Box marginRight={2}>
                        <UserAvatar user={user} size={96} />
                    </ui.Box>
                    <ui.Box flex justifyContent='space-around'>
                        <ui.Stack innerGrow row marginBottom alignItems='center'>
                            <ui.Box flexCenter>
                                <ui.Text children={user.stats.rides} semiBold />
                                <ui.Text variant='caption' children='Rides' marginBottom={0.5} />
                            </ui.Box>
                            <ui.Box flexCenter onPress={user.stats.followers ? () => showFriends('followedBy') : undefined}>
                                <ui.Text children={user.stats.followers} semiBold />
                                <ui.Text variant='caption' children='Followers' marginBottom={0.5} />
                            </ui.Box>
                            <ui.Box flexCenter onPress={user.stats.follows ? () => showFriends('following') : undefined}>
                                <ui.Text children={user.stats.follows} semiBold />
                                <ui.Text variant='caption' children='Following' marginBottom={0.5} />
                            </ui.Box>
                            <ui.Box flexCenter>
                                <RiderLevelIcon level={user.level} size={12} />
                                <ui.Text variant='caption' marginTop='5px'>
                                    Level
                                </ui.Text>
                            </ui.Box>
                        </ui.Stack>
                        <ui.Box row>
                            <ui.Box flex children={getMainButton()} marginRight />
                            {profile.id !== id && (
                                <ui.Button
                                    color='tertiary'
                                    StartIcon={icons.Chat}
                                    marginRight
                                    onPress={async () => {
                                        const { id: roomId } = await getUserRoom({ userId: id });
                                        return showScreen({
                                            children: (
                                                <ui.Screen name='ChatRoomScreen' header={user.name} white>
                                                    <ChatRoom roomId={roomId} />
                                                </ui.Screen>
                                            ),
                                        });
                                    }}
                                />
                            )}
                            <ui.Button
                                color='tertiary'
                                StartIcon={icons.Share}
                                onPress={() => {
                                    return share({
                                        title: user.name,
                                        message: user.name,
                                        url: `${config.web.url}/users/${user.slug}`,
                                    });
                                }}
                            />
                        </ui.Box>
                    </ui.Box>
                </ui.Box>
                <ui.Stack spacing={0.5} marginBottom={2}>
                    <ui.Box row justifyContent='space-between' flex>
                        <ui.Text flex children={user.name} semiBold marginRight />
                        <ui.Text children={formatSlug(user.slug)} maxWidth='50%' variant='caption' selectable />
                    </ui.Box>
                    {/* <ui.Stack row spacing>
                        {user.bikeType.map((x) => (
                            <ui.Box key={x} row>
                                <BikeTypeIcon type={x} size={14} />
                                <ui.Text variant='body2' children={getBikeTypeTitle(x)} semiBold marginLeft />
                            </ui.Box>
                        ))}
                    </ui.Stack> */}
                    {user.location && (
                        <ui.Box
                            row
                            onPress={() => {
                                showScreen({
                                    children: (
                                        <ui.Screen bottomSafeArea={false} name='UserLocationScreen' header={user.name}>
                                            <InteractiveMap
                                                flex
                                                toolbarBottom={0}
                                                cameraProps={{
                                                    zoomLevel: 12,
                                                    centerCoordinate: user.location?.location.coordinates,
                                                }}
                                            >
                                                <UserMarker user={user} navigate={false} />
                                            </InteractiveMap>
                                        </ui.Screen>
                                    ),
                                });
                            }}
                        >
                            <ui.Box marginTop='4px'>
                                <icons.Marker width={12} height={12} />
                            </ui.Box>
                            <ui.Text variant='caption' children={user.location.name} marginLeft={0.5} />
                        </ui.Box>
                    )}
                    {user.bio ? <ui.Text children={user.bio} /> : null}
                </ui.Stack>
            </ui.Box>
            <ui.Divider />
            <ui.Tabs flex lazy>
                <ui.Tab
                    name='Joined'
                    title='Joined'
                    Icon={icons.Rides}
                    paddingTop={2}
                    paddingHorizontal={2}
                    paddingBottom={maxPaddingBottom(1)}
                    flex
                    backgroundColor
                >
                    <FilteredRidesFirstPage filter={{ participantId: user.id }} title='Joined Rides' />
                </ui.Tab>
                <ui.Tab
                    Icon={icons.Graph}
                    name='Organized'
                    title='Organized'
                    paddingTop={2}
                    paddingHorizontal={2}
                    paddingBottom={maxPaddingBottom(1)}
                    flex
                    backgroundColor
                >
                    <FilteredRidesFirstPage filter={{ organizerId: user.id }} title='Organized Rides' />
                </ui.Tab>
                <ui.Tab
                    name='Photos'
                    title='Photos'
                    Icon={icons.Image}
                    paddingBottom={maxPaddingBottom(1)}
                    flex
                    backgroundColor
                >
                    <UserImages userId={user.id} />
                </ui.Tab>
            </ui.Tabs>
        </ui.ScrollView>
    );
});

type FilteredRidesFirstPageProps = {
    title: string;
    filter: RpcInput<'ride/find'>['filter'];
};

const FilteredRidesFirstPage: FC<FilteredRidesFirstPageProps> = ({ filter, title }) => {
    const { showScreen } = useScreen();

    const ridesQuery = useRpc('ride/find').useQuery({
        input: { filter, page: 1 },
        placeholderData: keepPreviousData,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useFocusEffect(useCallback(() => void ridesQuery.refetch(), []));

    if (!ridesQuery.isSuccess) {
        return <ui.FetchFallback query={ridesQuery} spinner />;
    }

    return ridesQuery.data.items.length > 0 ? (
        <ui.Box>
            <ui.Stack spacing={2}>
                {ridesQuery.data.items
                    .map((x) => (x.type === 'ride' ? <RideCard key={x.id} ride={x.ride} /> : null))
                    .filter(assert.exists)}
            </ui.Stack>
            {ridesQuery.data.hasMore && (
                <ui.Button
                    color='light'
                    children='Show All'
                    marginTop={2}
                    onPress={() => showScreen({ children: <FilteredRidesScreen filter={filter} title={title} /> })}
                />
            )}
        </ui.Box>
    ) : (
        <ui.Empty children='There are no rides yet' />
    );
};

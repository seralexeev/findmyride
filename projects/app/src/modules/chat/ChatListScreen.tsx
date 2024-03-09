import { RpcItemsOutput } from '@findmyride/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { FC } from 'react';
import { RpcFlatList } from '../../api/RpcFlatList';
import { useInvalidate } from '../../api/rpc';
import { useEvent } from '../../hooks/useEvent';
import { ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { RideProfile } from '../rides/view/RideProfileScreen';
import { UserAvatar } from '../user/UserAvatar';
import { UserAvatarStack } from '../user/UserAvatarStack';
import { ChatRoom } from './ChatRoom';

export const ChatListScreen: FC = () => {
    const { showScreen } = useScreen();
    const invalidate = useInvalidate();

    useFocusEffect(useEvent(() => void invalidate(['chat/get_all_rooms'])));

    const openChat = (item: RpcItemsOutput<'chat/get_all_rooms'>) => {
        showScreen({
            children: (
                <ui.Screen
                    name='ChatRoomScreen'
                    header={item.title}
                    white
                    headerRight={
                        item.ride ? (
                            <ui.Button
                                // StartIcon={(props) => <Iconify icon='solar:bicycling-round-line-duotone' {...props} />}
                                color='transparent'
                                size='large'
                                onPress={() => item.ride && showScreen({ children: <RideProfile id={item.ride.id} /> })}
                            />
                        ) : undefined
                    }
                >
                    <ChatRoom roomId={item.id} />
                </ui.Screen>
            ),
        });
    };

    return (
        <ui.Screen backgroundColor name='ChatListScreen' bottomSafeArea={false} header='Chats' white>
            <RpcFlatList
                endpoint='chat/get_all_rooms'
                payload={{}}
                renderItem={({ item }) => {
                    const user = item.ride?.organizer ?? item.showUser;

                    return (
                        <ui.Box onPress={() => openChat(item)} row alignItems='center' justifyContent='space-between'>
                            <ui.Box row alignItems='center' flex>
                                {user && (
                                    <ui.Box marginRight>
                                        <UserAvatar user={user} size={54} />
                                    </ui.Box>
                                )}
                                <ui.Box flex>
                                    <ui.Text semiBold children={item.title} numberOfLines={1} />
                                    {typeof item.lastMessage?.text === 'string' && (
                                        <ui.Text variant='caption' numberOfLines={2} children={item.lastMessage?.text} />
                                    )}
                                </ui.Box>
                            </ui.Box>
                            <ui.Box marginLeft={2}>
                                {item.unreadCount > 0 ? (
                                    <ui.Box
                                        round
                                        bgPalette='primary'
                                        minWidth={28}
                                        height={28}
                                        paddingHorizontal={1}
                                        paddingTop={1}
                                    >
                                        <ui.Text children={item.unreadCount} semiBold color='white' fontSize={14} center />
                                    </ui.Box>
                                ) : item.ride ? (
                                    <UserAvatarStack users={item.usersPick} />
                                ) : null}
                            </ui.Box>
                        </ui.Box>
                    );
                }}
                keyExtractor={(x, query) => `${x.id}-${query.dataUpdatedAt}`}
                paddingHorizontal={2}
                paddingVertical={2}
                ItemSeparatorComponent={ui.BoxSeparator[2]}
                empty='There are no messages yet'
            />
        </ui.Screen>
    );
};

import { RpcItemsOutput, RpcOutput, UserVm } from '@findmyride/api';
import { useRoute } from '@react-navigation/native';
import { compareAsc } from 'date-fns';
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Composer, GiftedChat, IMessage, Send, User } from 'react-native-gifted-chat';
import { useRpc } from '../../api/rpc';
import { icons, ui } from '../../ui';
import { useGpxUpload } from '../rides/create/services';
import { useProfile } from '../user/ProfileProvider';
import { UserAvatar } from '../user/UserAvatar';
import { useOpenUserProfile } from '../user/services';

type ChatRoomProps = {
    roomId: string;
};

type RpcMessage = RpcItemsOutput<'chat/get_room_messages'>;
type ChatMessage = IMessage & {
    userRpc: Pick<UserVm, 'id' | 'avatar' | 'name'>;
};

const mapMessage = (message: RpcMessage): ChatMessage => {
    return {
        _id: message.id,
        createdAt: new Date(message.createdAt),
        text: message.text ?? '',
        sent: true,
        userRpc: message.user,
        user: {
            _id: message.user.id,
            name: message.user.name,
            avatar: message.user.avatar?.url,
        },
    };
};

const date = new Date();
export const ChatRoom: FC<ChatRoomProps> = memo(({ roomId }) => {
    const openProfile = useOpenUserProfile();
    const { profile } = useProfile();
    const [sendRideMessage] = useRpc('chat/send_room_message').useMutation();
    const [getRoomMessagesBack] = useRpc('chat/get_room_messages').useMutation();
    const [messages, setMessages] = useState<Record<string, ChatMessage>>({});
    const uploadGpx = useGpxUpload();

    const [forwardCursor, setForwardCursor] = useState(date);
    const [backCursor, setBackCursor] = useState<Date | undefined>(date);

    const onGetMessages = (items: RpcMessage[]) => {
        setMessages((prev) =>
            items.reduce(
                (acc, x) => {
                    acc[x.id] = mapMessage(x);
                    return acc;
                },
                { ...prev },
            ),
        );
    };

    const getRoomMessagesQuery = useRpc('chat/get_room_messages').useQuery({
        refetchInterval: 5000,
        input: { direction: 'forward', roomId, date: forwardCursor },
    });

    useEffect(() => {
        if (getRoomMessagesQuery.data) {
            const items = getRoomMessagesQuery.data.items;
            onGetMessages(items);
            const first = items[0];

            if (first) {
                setForwardCursor(new Date(first.createdAt));
            }
        }
    }, [getRoomMessagesQuery.data]);

    const loadBack = async () => {
        if (!backCursor) {
            return;
        }

        const { hasMore, items } = await getRoomMessagesBack({
            date: backCursor,
            direction: 'back',
            roomId,
        });

        if (hasMore && items) {
            const cursor = items[items.length - 1]?.createdAt;
            if (cursor) {
                setBackCursor(new Date(cursor));
            }
        }

        onGetMessages(items);
    };

    useEffect(() => {
        void loadBack();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const chatUser: User = useMemo(
        () => ({
            _id: profile.id,
            name: profile.name,
            avatar: profile.avatar?.url,
        }),
        [profile],
    );

    const updateMessage = (message: RpcOutput<'chat/send_room_message'>, replaceId?: string | number) => {
        setMessages((prev) => {
            const newValue = { ...prev };
            if (replaceId) {
                delete newValue[replaceId];
            }

            newValue[message.id] = mapMessage(message);
            return newValue;
        });
    };

    const onSend = useCallback(
        (messages: IMessage[] = []) => {
            messages.map(async (x) => {
                setMessages((prev) => ({
                    ...prev,
                    [x._id]: {
                        ...x,
                        pending: true,
                        userRpc: profile,
                    },
                }));

                const message = await sendRideMessage({ roomId, text: x.text });
                updateMessage(message, x._id);
            });
        },
        [profile, roomId, sendRideMessage],
    );

    const sorted = Object.values(messages).sort((a, b) => compareAsc(a.createdAt, b.createdAt));

    return (
        <ui.Box flex>
            <GiftedChat
                // TODO: fixme https://github.com/FaridSafi/react-native-gifted-chat/issues/2359
                // wrapInSafeArea={false}
                renderAvatarOnTop
                messages={sorted}
                isKeyboardInternallyHandled={true}
                onSend={(messages) => onSend(messages)}
                user={chatUser}
                inverted={false}
                renderAvatar={(props) => {
                    const currentMessage = props.currentMessage;
                    if (!currentMessage) {
                        return null;
                    }

                    const message = currentMessage as ChatMessage;
                    return message.userRpc ? (
                        <ui.Box onPress={() => openProfile(message.userRpc.id)}>
                            <UserAvatar user={message.userRpc} size={36} />
                        </ui.Box>
                    ) : null;
                }}
                renderComposer={(props) => (
                    <ui.Box row padding alignItems='center' justifyContent='center'>
                        <ui.Button
                            round
                            width={36}
                            color='light'
                            StartIcon={icons.FileGpx}
                            onPress={async () => {
                                const gpx = await uploadGpx();
                                if (!gpx.gpxTrackUrl) {
                                    return;
                                }

                                const message = await sendRideMessage({ roomId, text: gpx.gpxTrackUrl });
                                updateMessage(message);
                            }}
                        />
                        <Composer
                            {...props}
                            textInputProps={{
                                ...props.textInputProps,
                                autoFocus: true,
                            }}
                            textInputStyle={{
                                fontSize: 18,
                                lineHeight: 22,
                            }}
                        />
                        <Send {...props} />
                    </ui.Box>
                )}
            />
        </ui.Box>
    );
});

export const ChatRoomScreen: FC = memo(() => {
    const route = useRoute<any>();

    return (
        <ui.Screen name='ChatRoomScreen' header='Chat' white>
            <ChatRoom roomId={route.params.id} />
        </ui.Screen>
    );
});

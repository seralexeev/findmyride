import { array, object } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { ChatRoom, Message, User, User2Room } from '../../entities';
import { navigationAction } from '../models/shared';
import { DateSchema, PageSchema, createPager } from '../models/utils';
import { NotificationService } from '../push/NotificationService';
import { refreshQueriesAction } from '../push/actions';
import { getRidePushTitle } from '../push/utils';
import { rpc } from '../rpc';
import { ChatService } from './ChatService';

@singleton()
export class ChatController {
    public constructor(
        private notificationService: NotificationService,
        private chatService: ChatService,
    ) {}

    public ['chat/get_room_messages'] = rpc({
        input: z.object({
            roomId: z.string(),
            date: DateSchema,
            direction: z.union([z.literal('forward'), z.literal('back')]),
        }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(1, 25);
            const items = await Message.find(ctx.t, {
                selector: Message.Selector,
                filter: {
                    roomId: { equalTo: input.roomId },
                    createdAt: input.date
                        ? input.direction === 'forward'
                            ? { greaterThan: new Date(input.date) }
                            : { lessThan: new Date(input.date) }
                        : undefined,
                },
                orderBy: [['createdAt', 'DESC']],
                first: pager.limit,
            });

            await this.chatService.updateLastSeenMessage(ctx, input.roomId);

            return pager.slice(items);
        },
    });

    public ['chat/send_room_message'] = rpc({
        input: z.object({
            roomId: z.string(),
            text: z.string(),
        }),
        resolve: async ({ ctx, input }) => {
            const message = await Message.create(ctx.t, {
                selector: Message.Selector,
                item: {
                    userId: ctx.user.id,
                    text: input.text,
                    roomId: input.roomId,
                },
            });

            await this.chatService.addToRoom(ctx, { roomId: input.roomId, userId: ctx.user.id });

            await ChatRoom.update(ctx.t, {
                pk: { id: input.roomId },
                patch: { lastMessageId: message.id },
            });

            await this.chatService.updateLastSeenMessage(ctx, input.roomId);

            const users = await User2Room.find(ctx.t, {
                filter: {
                    roomId: { equalTo: input.roomId },
                    userId: { notEqualTo: ctx.user.id },
                },
                selector: ['userId'],
            });

            for (const { userId } of users) {
                this.notificationService.sendMessagesByUserSilent({
                    userId,
                    notification: {
                        title: ctx.user.name || 'Find My Ride',
                        body: message.text || 'New message',
                        action: [
                            navigationAction('chat', input.roomId),
                            refreshQueriesAction([
                                'home/data',
                                'chat/get_all_rooms',
                                'chat/get_unread_count',
                                'chat/get_room_messages',
                            ]),
                        ],
                    },
                });
            }

            return message;
        },
    });

    public ['chat/get_all_rooms'] = rpc({
        input: z.object({ page: PageSchema }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(input.page, 25);

            const ids = await ctx.t.sql<{ id: string }>`
                SELECT r.id FROM user2rooms AS ur
                JOIN chat_rooms AS r ON r.id = room_id
                WHERE ur.user_id = ${ctx.user.id}
                ORDER BY r.updated_at DESC
                LIMIT ${pager.limit}
                OFFSET ${pager.offset}
            `.then((res) => res.map((x) => x.id));

            const unreadCount = await this.chatService.getUnreadMessagesCountForRooms(ctx, ids);

            const rooms = await ChatRoom.find(ctx.t, {
                filter: { id: { in: ids } },
                selector: {
                    id: true,
                    lastMessage: Message.Selector,
                    ride: {
                        id: true,
                        title: true,
                        startName: true,
                        startDate: true,
                        startTimezoneId: true,
                        organizer: User.Selector,
                    },
                    user2RoomsByRoomIdConnection: {
                        selector: { nodes: { user: User.Selector } },
                        first: 5,
                    },
                    updatedAt: true,
                },
            }).then((res) =>
                res.map((x) => {
                    const showUser = x.user2RoomsByRoomIdConnection.nodes.filter((u) => u.user.id !== ctx.user.id)[0]?.user;

                    return {
                        ...object.pick(x, ['id', 'lastMessage', 'ride', 'updatedAt']),
                        title: (x.ride ? getRidePushTitle(x.ride) : showUser?.name) || 'Chat',
                        usersPick: x.user2RoomsByRoomIdConnection.nodes.map((u) => u.user),
                        unreadCount: unreadCount[x.id] ?? 0,
                        showUser,
                    };
                }),
            );

            return pager.slice(array.orderAs(ids, rooms, (x) => x.id));
        },
    });

    public ['chat/get_unread_count'] = rpc({
        input: z.object({ roomId: z.string() }),
        resolve: async ({ ctx, input }) => {
            const { [input.roomId]: count } = await this.chatService.getUnreadMessagesCountForRooms(ctx, [input.roomId]);

            return { count };
        },
    });

    public ['chat/get_user_room'] = rpc({
        input: z.object({ userId: z.string() }),
        resolve: async ({ ctx, input }) => {
            let [room] = await ctx.t.sql<{ id: string }>`
                SELECT u1.room_id AS id 
                FROM user2rooms AS u1
                JOIN user2rooms AS u2 ON u1.room_id = u2.room_id
                JOIN chat_rooms AS r ON r.id = u1.room_id
                WHERE TRUE 
                    AND u1.user_id = ${ctx.user.id} AND u2.user_id = ${input.userId}
                    AND r.ride_id IS NULL
            `;

            if (!room) {
                room = await ChatRoom.create(ctx.t, {
                    item: {},
                    selector: ['id'],
                });

                await Promise.all([
                    this.chatService.addToRoom(ctx, { roomId: room.id, userId: ctx.user.id }),
                    this.chatService.addToRoom(ctx, { roomId: room.id, userId: input.userId }),
                ]);
            }

            return room;
        },
    });
}

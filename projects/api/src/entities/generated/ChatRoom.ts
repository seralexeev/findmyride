/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, ForeignField, PrimaryKey, QueryableListField } from '@untype/orm';
import type { Message, Ride, User, User2Room } from '.';
import { OverrideMap } from '../override';
import { ChatRoomAccessor } from '../accessors/ChatRoomAccessor';

// prettier-ignore
export interface ChatRoom extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    lastMessageId: Field<string | null, string | null | undefined>;
    rideId: Field<string | null, string | null | undefined>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    lastMessage: ForeignField<Message | null>;
    messagesByRoomId: QueryableListField<Message>;
    messagesByUser2RoomRoomIdAndLastSeenMessageIdList: QueryableListField<Message>;
    ride: ForeignField<Ride | null>;
    user2RoomsByRoomId: QueryableListField<User2Room>;
    usersByMessageRoomIdAndUserIdList: QueryableListField<User>;
    usersByUser2RoomRoomIdAndUserIdList: QueryableListField<User>;

    messagesByRoomIdConnection: ConnectionField<Message>;
    messagesByUser2RoomRoomIdAndLastSeenMessageId: ConnectionField<Message>;
    user2RoomsByRoomIdConnection: ConnectionField<User2Room>;
    usersByMessageRoomIdAndUserId: ConnectionField<User>;
    usersByUser2RoomRoomIdAndUserId: ConnectionField<User>;
}, OverrideMap['ChatRoom']> { }

export const ChatRoom = new ChatRoomAccessor();

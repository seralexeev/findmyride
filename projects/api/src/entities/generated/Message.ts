/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, ForeignField, PrimaryKey, QueryableListField } from '@untype/orm';
import type { ChatRoom, Ride, User, User2Room } from '.';
import { OverrideMap } from '../override';
import { MessageAccessor } from '../accessors/MessageAccessor';

// prettier-ignore
export interface Message extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    roomId: Field<string, string>;
    text: Field<string | null, string | null | undefined>;
    userId: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    chatRoomsByLastMessageId: QueryableListField<ChatRoom>;
    chatRoomsByUser2RoomLastSeenMessageIdAndRoomIdList: QueryableListField<ChatRoom>;
    ridesByChatRoomLastMessageIdAndRideIdList: QueryableListField<Ride>;
    room: ForeignField<ChatRoom>;
    user: ForeignField<User>;
    user2RoomsByLastSeenMessageId: QueryableListField<User2Room>;
    usersByUser2RoomLastSeenMessageIdAndUserIdList: QueryableListField<User>;

    chatRoomsByLastMessageIdConnection: ConnectionField<ChatRoom>;
    chatRoomsByUser2RoomLastSeenMessageIdAndRoomId: ConnectionField<ChatRoom>;
    ridesByChatRoomLastMessageIdAndRideId: ConnectionField<Ride>;
    user2RoomsByLastSeenMessageIdConnection: ConnectionField<User2Room>;
    usersByUser2RoomLastSeenMessageIdAndUserId: ConnectionField<User>;
}, OverrideMap['Message']> { }

export const Message = new MessageAccessor();

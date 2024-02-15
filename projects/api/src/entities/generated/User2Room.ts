/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, ForeignField, PrimaryKey } from '@untype/orm';
import type { ChatRoom, Message, User } from '.';
import { OverrideMap } from '../override';
import { User2RoomAccessor } from '../accessors/User2RoomAccessor';

// prettier-ignore
export interface User2Room extends ApplyOverride<{
    pk: PrimaryKey<{ userId: string, roomId: string }>;

    roomId: Field<string, string>;
    userId: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    lastSeenMessageId: Field<string | null, string | null | undefined>;

    lastSeenMessage: ForeignField<Message | null>;
    room: ForeignField<ChatRoom>;
    user: ForeignField<User>;
}, OverrideMap['User2Room']> { }

export const User2Room = new User2RoomAccessor();

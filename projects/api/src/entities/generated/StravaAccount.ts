/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, PrimaryKey, QueryableListField } from '@untype/orm';
import type { File, User } from '.';
import { JsonValue } from 'type-fest';
import { OverrideMap } from '../override';
import { StravaAccountAccessor } from '../accessors/StravaAccountAccessor';

// prettier-ignore
export interface StravaAccount extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    accessToken: Field<string, string>;
    athleteId: Field<string, string>;
    profile: Field<JsonValue, JsonValue>;
    refreshToken: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    filesByUserStravaIdAndAvatarId: ConnectionField<File>;
    usersByStravaIdConnection: ConnectionField<User>;

    filesByUserStravaIdAndAvatarIdList: QueryableListField<File>;
    usersByStravaId: QueryableListField<User>;
}, OverrideMap['StravaAccount']> { }

export const StravaAccount = new StravaAccountAccessor();

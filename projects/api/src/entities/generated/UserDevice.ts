/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, ForeignField, PrimaryKey, QueryableField } from '@untype/orm';
import type { GeographyPoint, User } from '.';
import { JsonValue } from 'type-fest';
import { Point } from '@untype/geo';
import { OverrideMap } from '../override';
import { UserDeviceAccessor } from '../accessors/UserDeviceAccessor';

// prettier-ignore
export interface UserDevice extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string>;

    deviceInfo: Field<JsonValue | null, JsonValue | null | undefined>;
    fcmToken: Field<string | null, string | null | undefined>;
    locationUpdatedAt: Field<Date | null, Date | null | undefined>;
    notificationStatus: Field<string | null, string | null | undefined>;
    pushAuthorizationStatus: Field<string | null, string | null | undefined>;
    refreshToken: Field<string | null, string | null | undefined>;
    userId: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    location: QueryableField<GeographyPoint | null, Point | undefined>;
    user: ForeignField<User>;
}, OverrideMap['UserDevice']> { }

export const UserDevice = new UserDeviceAccessor();

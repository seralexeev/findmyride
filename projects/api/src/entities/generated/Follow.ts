/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, ForeignField, PrimaryKey } from '@untype/orm';
import type { User } from '.';
import { OverrideMap } from '../override';
import { FollowAccessor } from '../accessors/FollowAccessor';

// prettier-ignore
export interface Follow extends ApplyOverride<{
    pk: PrimaryKey<{ userId: string, followingId: string }>;

    followingId: Field<string, string>;
    userId: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    following: ForeignField<User>;
    user: ForeignField<User>;
}, OverrideMap['Follow']> { }

export const Follow = new FollowAccessor();

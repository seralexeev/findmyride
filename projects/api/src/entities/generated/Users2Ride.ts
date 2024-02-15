/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, ForeignField, PrimaryKey } from '@untype/orm';
import type { Ride, User } from '.';
import { OverrideMap } from '../override';
import { Users2RideAccessor } from '../accessors/Users2RideAccessor';

// prettier-ignore
export interface Users2Ride extends ApplyOverride<{
    pk: PrimaryKey<{ rideId: string, userId: string }>;

    rideId: Field<string, string>;
    userId: Field<string, string>;

    status: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    ride: ForeignField<Ride>;
    user: ForeignField<User>;
}, OverrideMap['Users2Ride']> { }

export const Users2Ride = new Users2RideAccessor();

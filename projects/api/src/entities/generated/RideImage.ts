/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, ForeignField, PrimaryKey } from '@untype/orm';
import type { File, Ride, User } from '.';
import { OverrideMap } from '../override';
import { RideImageAccessor } from '../accessors/RideImageAccessor';

// prettier-ignore
export interface RideImage extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    description: Field<string | null, string | null | undefined>;
    fileId: Field<string, string>;
    rideId: Field<string, string>;
    userId: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    file: ForeignField<File>;
    ride: ForeignField<Ride>;
    user: ForeignField<User>;
}, OverrideMap['RideImage']> { }

export const RideImage = new RideImageAccessor();

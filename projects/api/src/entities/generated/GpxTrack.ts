/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, ForeignField, PrimaryKey, QueryableField, QueryableListField } from '@untype/orm';
import type { File, GeographyLineString, GeographyPoint, Ride, User } from '.';
import { LineString, Point } from '@untype/geo';
import { JsonValue } from 'type-fest';
import { OverrideMap } from '../override';
import { GpxTrackAccessor } from '../accessors/GpxTrackAccessor';

// prettier-ignore
export interface GpxTrack extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    bbox: Field<JsonValue | null, JsonValue | null | undefined>;
    calculatedDistance: Field<number | null, number | null | undefined>;
    elevation: Field<number | null, number | null | undefined>;
    fileId: Field<string, string>;
    finishName: Field<string, string>;
    startName: Field<string, string>;
    userId: Field<string, string>;

    file: ForeignField<File>;
    filesByRideGpxTrackIdAndElevationProfileIdList: QueryableListField<File>;
    filesByRideGpxTrackIdAndStaticMapIdList: QueryableListField<File>;
    finishLocation: QueryableField<GeographyPoint, Point>;
    rides: QueryableListField<Ride>;
    startLocation: QueryableField<GeographyPoint, Point>;
    track: QueryableField<GeographyLineString, LineString>;
    user: ForeignField<User>;
    usersByRideGpxTrackIdAndOrganizerIdList: QueryableListField<User>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    filesByRideGpxTrackIdAndElevationProfileId: ConnectionField<File>;
    filesByRideGpxTrackIdAndStaticMapId: ConnectionField<File>;
    ridesConnection: ConnectionField<Ride>;
    usersByRideGpxTrackIdAndOrganizerId: ConnectionField<User>;
}, OverrideMap['GpxTrack']> { }

export const GpxTrack = new GpxTrackAccessor();

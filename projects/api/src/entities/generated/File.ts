/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, PrimaryKey, QueryableListField } from '@untype/orm';
import type { GpxTrack, Ride, RideImage, StravaAccount, User } from '.';
import { JsonValue } from 'type-fest';
import { OverrideMap } from '../override';
import { FileAccessor } from '../accessors/FileAccessor';

// prettier-ignore
export interface File extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    bucket: Field<string, string>;
    imageSizes: Field<JsonValue | null, JsonValue | null | undefined>;
    key: Field<string, string>;
    meta: Field<JsonValue, JsonValue | undefined>;
    mimeType: Field<string, string>;
    size: Field<number | null, number | null | undefined>;
    type: Field<string, string>;
    url: Field<string, string>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    filesByRideElevationProfileIdAndStaticMapId: ConnectionField<File>;
    filesByRideStaticMapIdAndElevationProfileId: ConnectionField<File>;
    gpxTracksByRideElevationProfileIdAndGpxTrackId: ConnectionField<GpxTrack>;
    gpxTracksByRideStaticMapIdAndGpxTrackId: ConnectionField<GpxTrack>;
    gpxTracksConnection: ConnectionField<GpxTrack>;
    rideImagesConnection: ConnectionField<RideImage>;
    ridesByElevationProfileIdConnection: ConnectionField<Ride>;
    ridesByRideImageFileIdAndRideId: ConnectionField<Ride>;
    ridesByStaticMapIdConnection: ConnectionField<Ride>;
    stravaAccountsByUserAvatarIdAndStravaId: ConnectionField<StravaAccount>;
    usersByAvatarIdConnection: ConnectionField<User>;
    usersByGpxTrackFileIdAndUserId: ConnectionField<User>;
    usersByRideElevationProfileIdAndOrganizerId: ConnectionField<User>;
    usersByRideImageFileIdAndUserId: ConnectionField<User>;
    usersByRideStaticMapIdAndOrganizerId: ConnectionField<User>;

    filesByRideElevationProfileIdAndStaticMapIdList: QueryableListField<File>;
    filesByRideStaticMapIdAndElevationProfileIdList: QueryableListField<File>;
    gpxTracks: QueryableListField<GpxTrack>;
    gpxTracksByRideElevationProfileIdAndGpxTrackIdList: QueryableListField<GpxTrack>;
    gpxTracksByRideStaticMapIdAndGpxTrackIdList: QueryableListField<GpxTrack>;
    rideImages: QueryableListField<RideImage>;
    ridesByElevationProfileId: QueryableListField<Ride>;
    ridesByRideImageFileIdAndRideIdList: QueryableListField<Ride>;
    ridesByStaticMapId: QueryableListField<Ride>;
    stravaAccountsByUserAvatarIdAndStravaIdList: QueryableListField<StravaAccount>;
    usersByAvatarId: QueryableListField<User>;
    usersByGpxTrackFileIdAndUserIdList: QueryableListField<User>;
    usersByRideElevationProfileIdAndOrganizerIdList: QueryableListField<User>;
    usersByRideImageFileIdAndUserIdList: QueryableListField<User>;
    usersByRideStaticMapIdAndOrganizerIdList: QueryableListField<User>;
}, OverrideMap['File']> { }

export const File = new FileAccessor();

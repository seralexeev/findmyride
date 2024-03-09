import { BoundingBox, LineString, Point } from '@untype/geo';
import { Field, QueryableField } from '@untype/orm';
import { FileMeta } from '../modules/files/models';
import { NotificationStatus } from '../modules/models/users';
import {
    BikeType,
    ParticipantStatus,
    RidePrivacy,
    RideStatus,
    RideVisibility,
    RiderLevel,
    TrackSource,
} from '../modules/rides/models';
import { FieldsOverride, GeographyLineString } from './generated';

export type OverrideMap = FieldsOverride<{
    GeographyPoint: {
        geojson: Field<Point, never>;
    };
    GeographyLineString: {
        geojson: Field<LineString, never>;
    };
    Ride: {
        status: Field<RideStatus, RideStatus>;
        track: QueryableField<GeographyLineString | null, LineString | undefined | null>;
        trackSource: Field<TrackSource, TrackSource>;
        riderLevel: Field<RiderLevel, RiderLevel>;
        bikeType: Field<BikeType, BikeType>;
        visibility: Field<RideVisibility, RideVisibility>;
        privacy: Field<RidePrivacy, RidePrivacy>;
        bbox: Field<BoundingBox | null, BoundingBox | null | undefined>;
    };
    File: {
        meta: Field<FileMeta, FileMeta | undefined>;
    };
    PresignedUrl: {
        meta: Field<FileMeta, FileMeta | undefined>;
    };
    UserSession: {
        notificationStatus: Field<NotificationStatus | null, NotificationStatus | null | undefined>;
    };
    User: {
        level: Field<RiderLevel, RiderLevel | undefined>;
        bikeType: Field<BikeType[], BikeType[] | undefined>;
    };
    Users2Ride: {
        status: Field<ParticipantStatus, ParticipantStatus>;
    };
    GpxTrack: {
        bbox: Field<BoundingBox | null, BoundingBox | null | undefined>;
    };
}>;

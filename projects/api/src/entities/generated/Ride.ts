/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, ForeignField, PrimaryKey, QueryableField, QueryableListField } from '@untype/orm';
import type { ChatRoom, File, GeographyLineString, GeographyPoint, GpxTrack, Message, RideImage, User, Users2Ride } from '.';
import { LineString, Point } from '@untype/geo';
import { JsonValue } from 'type-fest';
import { OverrideMap } from '../override';
import { RideAccessor } from '../accessors/RideAccessor';

// prettier-ignore
export interface Ride extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    autoFinish: Field<number | null, number | null | undefined>;
    autoStart: Field<boolean, boolean | undefined>;
    bbox: Field<JsonValue | null, JsonValue | null | undefined>;
    bikeType: Field<string, string>;
    calculatedDistance: Field<number | null, number | null | undefined>;
    chatLink: Field<string | null, string | null | undefined>;
    description: Field<string | null, string | null | undefined>;
    elevation: Field<number | null, number | null | undefined>;
    elevationProfileId: Field<string | null, string | null | undefined>;
    endedAt: Field<Date | null, Date | null | undefined>;
    finishedAt: Field<Date | null, Date | null | undefined>;
    finishName: Field<string | null, string | null | undefined>;
    gpxTrackId: Field<string | null, string | null | undefined>;
    manualDistance: Field<number | null, number | null | undefined>;
    organizerId: Field<string, string>;
    privacy: Field<string, string>;
    riderLevel: Field<string, string>;
    startDate: Field<Date, Date>;
    startedAt: Field<Date | null, Date | null | undefined>;
    startName: Field<string, string>;
    startTimezoneId: Field<string, string>;
    startTimezoneName: Field<string, string>;
    staticMapId: Field<string, string>;
    status: Field<string, string>;
    termsUrl: Field<string | null, string | null | undefined>;
    title: Field<string | null, string | null | undefined>;
    trackSource: Field<string, string>;
    trackSourceUrl: Field<string | null, string | null | undefined>;
    visibility: Field<string, string>;

    chatRooms: QueryableListField<ChatRoom>;
    elevationProfile: ForeignField<File | null>;
    filesByRideImageRideIdAndFileIdList: QueryableListField<File>;
    finishLocation: QueryableField<GeographyPoint | null, Point | undefined>;
    gpxTrack: ForeignField<GpxTrack | null>;
    messagesByChatRoomRideIdAndLastMessageIdList: QueryableListField<Message>;
    organizer: ForeignField<User>;
    rideImages: QueryableListField<RideImage>;
    startLocation: QueryableField<GeographyPoint, Point>;
    staticMap: ForeignField<File>;
    track: QueryableField<GeographyLineString | null, LineString | undefined>;
    users2Rides: QueryableListField<Users2Ride>;
    usersByRideImageRideIdAndUserIdList: QueryableListField<User>;
    usersByUsers2RideRideIdAndUserIdList: QueryableListField<User>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    chatRoomsConnection: ConnectionField<ChatRoom>;
    filesByRideImageRideIdAndFileId: ConnectionField<File>;
    messagesByChatRoomRideIdAndLastMessageId: ConnectionField<Message>;
    rideImagesConnection: ConnectionField<RideImage>;
    users2RidesConnection: ConnectionField<Users2Ride>;
    usersByRideImageRideIdAndUserId: ConnectionField<User>;
    usersByUsers2RideRideIdAndUserId: ConnectionField<User>;
}, OverrideMap['Ride']> { }

export const Ride = new RideAccessor();

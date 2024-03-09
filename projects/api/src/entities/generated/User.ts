/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, ConnectionField, Field, ForeignField, PrimaryKey, QueryableField, QueryableListField } from '@untype/orm';
import type { ChatRoom, File, Follow, GeographyPoint, GpxTrack, Message, Ride, RideImage, StravaAccount, User2Room, Users2Ride, UserSession } from '.';
import { Point } from '@untype/geo';
import { OverrideMap } from '../override';
import { UserAccessor } from '../accessors/UserAccessor';

// prettier-ignore
export interface User extends ApplyOverride<{
    pk: PrimaryKey<{ id: string }>;

    id: Field<string, string | undefined>;

    avatarId: Field<string | null, string | null | undefined>;
    bikeType: Field<string[], string[] | undefined>;
    bio: Field<string | null, string | null | undefined>;
    email: Field<string, string>;
    isAnonymous: Field<boolean, boolean | undefined>;
    isDeleted: Field<boolean, boolean | undefined>;
    level: Field<string, string | undefined>;
    locationName: Field<string | null, string | null | undefined>;
    name: Field<string, string>;
    slug: Field<string, string>;
    stravaId: Field<string | null, string | null | undefined>;
    useCurrentLocation: Field<boolean | null, boolean | null | undefined>;
    website: Field<string | null, string | null | undefined>;

    avatar: ForeignField<File | null>;
    chatRoomsByMessageUserIdAndRoomIdList: QueryableListField<ChatRoom>;
    chatRoomsByUser2RoomUserIdAndRoomIdList: QueryableListField<ChatRoom>;
    filesByGpxTrackUserIdAndFileIdList: QueryableListField<File>;
    filesByRideImageUserIdAndFileIdList: QueryableListField<File>;
    filesByRideOrganizerIdAndElevationProfileIdList: QueryableListField<File>;
    filesByRideOrganizerIdAndStaticMapIdList: QueryableListField<File>;
    follows: QueryableListField<Follow>;
    followsByFollowingId: QueryableListField<Follow>;
    gpxTracks: QueryableListField<GpxTrack>;
    gpxTracksByRideOrganizerIdAndGpxTrackIdList: QueryableListField<GpxTrack>;
    location: QueryableField<GeographyPoint | null, Point | undefined>;
    messages: QueryableListField<Message>;
    messagesByUser2RoomUserIdAndLastSeenMessageIdList: QueryableListField<Message>;
    rideImages: QueryableListField<RideImage>;
    ridesByOrganizerId: QueryableListField<Ride>;
    ridesByRideImageUserIdAndRideIdList: QueryableListField<Ride>;
    ridesByUsers2RideUserIdAndRideIdList: QueryableListField<Ride>;
    strava: ForeignField<StravaAccount | null>;
    user2Rooms: QueryableListField<User2Room>;
    users2Rides: QueryableListField<Users2Ride>;
    usersByFollowFollowingIdAndUserIdList: QueryableListField<User>;
    usersByFollowUserIdAndFollowingIdList: QueryableListField<User>;
    userSessions: QueryableListField<UserSession>;

    createdAt: Field<Date, Date | undefined>;
    updatedAt: Field<Date, Date | undefined>;

    chatRoomsByMessageUserIdAndRoomId: ConnectionField<ChatRoom>;
    chatRoomsByUser2RoomUserIdAndRoomId: ConnectionField<ChatRoom>;
    filesByGpxTrackUserIdAndFileId: ConnectionField<File>;
    filesByRideImageUserIdAndFileId: ConnectionField<File>;
    filesByRideOrganizerIdAndElevationProfileId: ConnectionField<File>;
    filesByRideOrganizerIdAndStaticMapId: ConnectionField<File>;
    followsByFollowingIdConnection: ConnectionField<Follow>;
    followsConnection: ConnectionField<Follow>;
    gpxTracksByRideOrganizerIdAndGpxTrackId: ConnectionField<GpxTrack>;
    gpxTracksConnection: ConnectionField<GpxTrack>;
    messagesByUser2RoomUserIdAndLastSeenMessageId: ConnectionField<Message>;
    messagesConnection: ConnectionField<Message>;
    rideImagesConnection: ConnectionField<RideImage>;
    ridesByOrganizerIdConnection: ConnectionField<Ride>;
    ridesByRideImageUserIdAndRideId: ConnectionField<Ride>;
    ridesByUsers2RideUserIdAndRideId: ConnectionField<Ride>;
    user2RoomsConnection: ConnectionField<User2Room>;
    users2RidesConnection: ConnectionField<Users2Ride>;
    usersByFollowFollowingIdAndUserId: ConnectionField<User>;
    usersByFollowUserIdAndFollowingId: ConnectionField<User>;
    userSessionsConnection: ConnectionField<UserSession>;
}, OverrideMap['User']> { }

export const User = new UserAccessor();

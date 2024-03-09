/* eslint-disable */

import { EntityFieldsOverride, OverrideConstraint } from '@untype/orm';

export * from './ChatRoom';
import { ChatRoom } from './ChatRoom';

export * from './File';
import { File } from './File';

export * from './Follow';
import { Follow } from './Follow';

export * from './GeographyLineString';
import { GeographyLineString } from './GeographyLineString';

export * from './GeographyPoint';
import { GeographyPoint } from './GeographyPoint';

export * from './GpxTrack';
import { GpxTrack } from './GpxTrack';

export * from './Message';
import { Message } from './Message';

export * from './Ride';
import { Ride } from './Ride';

export * from './RideImage';
import { RideImage } from './RideImage';

export * from './StravaAccount';
import { StravaAccount } from './StravaAccount';

export * from './User';
import { User } from './User';

export * from './User2Room';
import { User2Room } from './User2Room';

export * from './UserSession';
import { UserSession } from './UserSession';

export * from './Users2Ride';
import { Users2Ride } from './Users2Ride';

export type EntityMap = {
    ChatRoom: ChatRoom;
    File: File;
    Follow: Follow;
    GeographyLineString: GeographyLineString;
    GeographyPoint: GeographyPoint;
    GpxTrack: GpxTrack;
    Message: Message;
    Ride: Ride;
    RideImage: RideImage;
    StravaAccount: StravaAccount;
    User: User;
    User2Room: User2Room;
    UserSession: UserSession;
    Users2Ride: Users2Ride;
};

export type FieldsOverride<T extends OverrideConstraint<EntityMap>> = EntityFieldsOverride<EntityMap, T>;

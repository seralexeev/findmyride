import { LocationWithName } from '@untype/geo';
import { z } from 'zod';

export type RiderLevel = z.infer<typeof RiderLevel>;
export const RiderLevel = z.union([z.literal('beginner'), z.literal('intermediate'), z.literal('pro')]);

export type BikeType = z.infer<typeof BikeType>;
export const BikeType = z.union([z.literal('road'), z.literal('mtb'), z.literal('gravel')]);

export type RidePrivacy = z.infer<typeof RidePrivacy>;
export const RidePrivacy = z.union([z.literal('public'), z.literal('private')]);

export type RideVisibility = z.infer<typeof RideVisibility>;
export const RideVisibility = z.union([z.literal('anyone'), z.literal('followers'), z.literal('follows'), z.literal('link')]);

export type TrackSource = z.infer<typeof TrackSource>;
export const TrackSource = z.union([
    z.literal('manual'),
    z.literal('gpx'),
    z.literal('strava'),
    z.literal('komoot'),
    z.literal('rwg'),
]);

export type ParticipantStatus = z.infer<typeof ParticipantStatus>;
export const ParticipantStatus = z.union([
    z.literal('approved'),
    z.literal('declined'),
    z.literal('refused'),
    z.literal('pending'),
    z.literal('invited'),
    z.literal('left'),
]);

export type RideStatus = z.infer<typeof RideStatus>;
export const RideStatus = z.union([z.literal('created'), z.literal('canceled'), z.literal('finished'), z.literal('started')]);

export const isRideEditable = (ride: { status: RideStatus }) => {
    return ride.status === 'created' || ride.status === 'started';
};

export type CreateRide = z.infer<typeof CreateRide>;
export const CreateRide = z.object({
    startDate: z.string(),
    riderLevel: RiderLevel,
    bikeType: BikeType,
    gpxTrackId: z.string().nullable(),
    manualDistance: z.number().nullable(),
    elevation: z.number().nullable(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    privacy: RidePrivacy,
    visibility: RideVisibility,
    trackSource: TrackSource.nullable(),
    trackSourceUrl: z.string().nullable(),
    start: LocationWithName,
    startTimezone: z.object({ id: z.string(), name: z.string() }),
    finish: LocationWithName.nullable(),
    autoStart: z.boolean(),
    autoFinish: z.number().nullable(),
    chatLink: z.string().nullable(),
    termsUrl: z.string().nullable().optional(),
});

export const UpdateRide = z.object({
    id: z.string(),
    startDate: z.string().optional(),
    riderLevel: RiderLevel.optional(),
    bikeType: BikeType.optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    privacy: RidePrivacy.optional(),
    visibility: RideVisibility.optional(),
    start: LocationWithName.optional(),
    startTimezone: z.object({ id: z.string(), name: z.string() }).optional(),
    finish: LocationWithName.optional(),
    autoStart: z.boolean().optional(),
    autoFinish: z.number().nullable().optional(),
    chatLink: z.string().nullable().optional(),
    termsUrl: z.string().nullable().optional(),
});

export type RideAction = z.infer<typeof RideAction>;
export const RideAction = z.union([
    z.object({
        type: z.literal('@ride/START'),
        payload: z.object({ rideId: z.string() }),
    }),
    z.object({
        type: z.literal('@ride/FINISH'),
        payload: z.object({ rideId: z.string() }),
    }),
    z.object({
        type: z.literal('@ride/CANCEL'),
        payload: z.object({ rideId: z.string() }),
    }),
]);

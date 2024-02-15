import { CustomMarkerOverlay, GeoJsonOverlay, PathOverlay, SimpleMarkerOverlay } from '@mapbox/mapbox-sdk/services/static';
import * as turf from '@turf/turf';
import { LineString, Position } from '@untype/geo';
import { array, object } from '@untype/toolbox';
import { format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { singleton } from 'tsyringe';
import { ChatRoom, File, GeoJsonSelector, GpxTrack, Ride, User, Users2Ride } from '../../entities';
import { schedule } from '../../worker';
import { ChatService } from '../chat/ChatService';
import { GeoService } from '../geo/GeoService';
import { Context } from '../models/context';
import { Colors, navigationAction } from '../models/shared';
import { getRidePushTitle } from '../push/utils';
import { CreateRide, TrackSource, isRideEditable } from './models';

export type RidePreviewVm = Awaited<ReturnType<RideService['getRidePreviews']>>[number];

@singleton()
export class RideService {
    public constructor(
        private geo: GeoService,
        private chatService: ChatService,
    ) {}

    public createRide = async (ctx: Context, args: { id?: string; organizerId: string; input: CreateRide }) => {
        const { input, organizerId, id } = args;

        const track = input.gpxTrackId
            ? await GpxTrack.findByPkOrError(ctx.t, {
                  pk: { id: input.gpxTrackId },
                  selector: { track: GeoJsonSelector },
              }).then((x) => x.track.geojson)
            : null;

        const imageArgs = {
            track,
            startCoordinates: input.start.location.coordinates,
            finishCoordinates: input.finish?.location.coordinates,
        };

        const [elevationProfileId, staticMapId] = await Promise.all([
            this.getElevationProfileId(imageArgs),
            this.getStaticMapId(imageArgs),
        ]);

        const startDate = zonedTimeToUtc(input.startDate, input.startTimezone.id);
        const ride = await Ride.create(ctx.t, {
            item: {
                id,
                ...object.pick(input, [
                    'bikeType',
                    'description',
                    'title',
                    'gpxTrackId',
                    'privacy',
                    'visibility',
                    'riderLevel',
                    'trackSourceUrl',
                ]),
                track,
                trackSource: input.trackSource as TrackSource,
                startDate,
                startName: input.start.name,
                startLocation: input.start.location,
                startTimezoneId: input.startTimezone.id,
                startTimezoneName: input.startTimezone.name,
                finishName: input.finish?.name,
                finishLocation: input.finish?.location,
                staticMapId,
                elevationProfileId,
                organizerId,
                manualDistance: input.manualDistance ?? undefined,
                elevation: input.elevation ?? undefined,
                status: 'created',
                autoStart: input.autoStart,
                autoFinish: input.autoFinish,
                chatLink: input.chatLink,
                termsUrl: input.termsUrl?.trim() ?? null,
            },
            selector: {
                id: true,
                organizer: User.Selector,
                startName: true,
                startTimezoneId: true,
                startDate: true,
                title: true,
            },
        });

        await ChatRoom.create(ctx.t, { item: { id: ride.id, rideId: ride.id } });
        await this.chatService.addToRoom(ctx, { roomId: ride.id, userId: organizerId });

        await schedule(
            ctx.t,
            {
                key: '@ride/START',
                input: { rideId: ride.id },
            },
            {
                runAt: startDate,
                jobKey: ride.id,
            },
        );

        await schedule(ctx.t, {
            key: '@push/FOLLOWING_RIDE',
            input: {
                rideId: ride.id,
                notification: {
                    title: getRidePushTitle(ride),
                    body: `${ride.organizer.name} has just created a ride`,
                    action: navigationAction('ride', ride.id),
                },
            },
        });

        await schedule(ctx.t, {
            key: '@push/RIDE_NEARBY',
            input: {
                rideId: ride.id,
                notification: {
                    title: getRidePushTitle(ride),
                    body: `A new ride has just been created nearby`,
                    action: navigationAction('ride', ride.id),
                },
            },
        });
    };

    public getStaticMapId = async ({
        track,
        finishCoordinates,
        startCoordinates,
    }: {
        track?: LineString | null;
        startCoordinates: Position;
        finishCoordinates?: Position;
    }) => {
        const overlays: Array<CustomMarkerOverlay | SimpleMarkerOverlay | PathOverlay | GeoJsonOverlay> = [];
        if (track) {
            const simplified = turf.simplify(track, {
                tolerance: 0.001,
            });

            overlays.push({
                path: { coordinates: simplified.coordinates, strokeColor: Colors.primary, strokeWidth: 5 },
            });
        }

        overlays.push({
            marker: {
                label: 'S',
                coordinates: startCoordinates,
                color: Colors.primary,
            },
        });

        if (finishCoordinates) {
            overlays.push({
                marker: {
                    label: 'F',
                    coordinates: finishCoordinates,
                    color: Colors.primary,
                },
            });
        }

        const options = !track && !finishCoordinates ? { zoom: 8, center: startCoordinates } : undefined;

        return (await this.geo.getStaticMapFile(overlays, options)).file.id;
    };

    private getElevationProfileId = async ({
        track,
        finishCoordinates,
        startCoordinates,
    }: {
        track?: LineString | null;
        startCoordinates: Position;
        finishCoordinates?: Position;
    }) => {
        try {
            if (!track) {
                if (!finishCoordinates) {
                    return null;
                }

                track = {
                    type: 'LineString',
                    coordinates: [startCoordinates, finishCoordinates],
                };
            }

            const { id } = await this.geo.getElevationProfileId(track);
            return id;
        } catch {
            return null;
        }
    };

    public getRidePreviews = async (ctx: Context, args: { ids: string[]; distancesToStart: Record<string, number | null> }) => {
        const { ids, distancesToStart } = args;
        const [items, participantStatuses] = await Promise.all([
            Ride.find(ctx.t, {
                filter: { id: { in: ids } },
                selector: {
                    id: true,
                    staticMap: File.Selector,
                    organizer: User.Selector,
                    startDate: true,
                    startName: true,
                    startLocation: GeoJsonSelector,
                    finishName: true,
                    manualDistance: true,
                    calculatedDistance: true,
                    riderLevel: true,
                    bikeType: true,
                    status: true,
                    privacy: true,
                    visibility: true,
                    trackSource: true,
                    startTimezoneId: true,
                    startTimezoneName: true,
                    autoFinish: true,
                    startedAt: true,
                    finishedAt: true,
                    title: true,
                    termsUrl: true,
                    rideImagesConnection: {
                        selector: { nodes: { file: File.Selector }, totalCount: true },
                        orderBy: [['createdAt', 'DESC']],
                        first: 3,
                    },
                    users2RidesConnection: {
                        selector: { nodes: { user: User.Selector }, totalCount: true },
                        filter: { status: { equalTo: 'approved' } },
                        first: 5,
                    },
                },
            }),
            Users2Ride.find(ctx.t, {
                selector: ['rideId', 'status'],
                filter: { userId: { equalTo: ctx.user.id }, rideId: { in: ids } },
            }).then((res) => {
                return array.reduceBy(
                    res,
                    (x) => x.rideId,
                    (x) => x.status,
                );
            }),
        ]);

        return items.map((x) => {
            const startDate = utcToZonedTime(x.startDate, x.startTimezoneId);

            return {
                ...object.pick(x, [
                    'id',
                    'bikeType',
                    'manualDistance',
                    'calculatedDistance',
                    'organizer',
                    'privacy',
                    'riderLevel',
                    'staticMap',
                    'status',
                    'visibility',
                    'trackSource',
                    'startedAt',
                    'finishedAt',
                    'title',
                    'autoFinish',
                    'termsUrl',
                ]),
                start: { name: x.startName },
                startLocation: x.startLocation.geojson,
                finish: { name: x.finishName },
                distanceToStart: distancesToStart[x.id] ?? null,
                startTimezone: { id: x.startTimezoneId, name: x.startTimezoneName },
                images: x.rideImagesConnection.nodes.map((x) => x.file),
                imagesCount: x.rideImagesConnection.totalCount,
                participantPick: x.users2RidesConnection.nodes.map((x) => x.user),
                participantCount: x.users2RidesConnection.totalCount,
                isEditable: isRideEditable(x),
                startDate,
                localStartDateString: format(startDate, 'dd MMM'),
                localStartTimeString: format(startDate, 'p'),
                isOrganizer: ctx.user.id === x.organizer.id,
                participantStatus: participantStatuses[x.id] ?? null,
            };
        });
    };

    public getActiveRidesCount = async (ctx: Context) => {
        const [row] = await ctx.t.sql<{ count: number }>`
            SELECT COUNT(DISTINCT r.id) as "count"
            FROM rides AS r
            LEFT JOIN users2rides AS u2r ON u2r.ride_id = r.id
            WHERE TRUE
                AND ((u2r.user_id = ${ctx.user.id} AND u2r.status = 'approved') OR r.organizer_id = ${ctx.user.id})
                AND (r.status = 'started' OR (r.status = 'created' AND now() + interval '3 hour' >= r.start_date))
        `;

        return {
            count: row?.count ?? 0,
        };
    };
}

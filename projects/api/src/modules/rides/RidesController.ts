import { BoundingBox, Point, Position } from '@untype/geo';
import { raw } from '@untype/pg';
import { NotFoundError, array, object } from '@untype/toolbox';
import { addMinutes, format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { File, GeoJsonSelector, Ride, User, Users2Ride } from '../../entities';
import { schedule } from '../../worker';
import { DateSchema, PageSchema, checkPermission, createPager } from '../models/utils';
import { getRidePushTitle } from '../push/utils';
import { rpc } from '../rpc';
import { RideService } from './RideService';
import { BikeType, CreateRide, ParticipantStatus, RideStatus, RiderLevel, UpdateRide, isRideEditable } from './models';

@singleton()
export class RidesController {
    public constructor(private rideService: RideService) {}

    public ['ride/create'] = rpc({
        input: CreateRide,
        resolve: ({ ctx, input }) => {
            return this.rideService.createRide(ctx, {
                organizerId: ctx.user.id,
                input,
            });
        },
    });

    public ['ride/update'] = rpc({
        input: UpdateRide,
        resolve: async ({ ctx, input }) => {
            const ride = await Ride.findByPkOrError(ctx.t, {
                pk: { id: input.id },
                selector: {
                    status: true,
                    startedAt: true,
                    organizerId: true,
                    track: GeoJsonSelector,
                    startLocation: GeoJsonSelector,
                    finishLocation: GeoJsonSelector,
                    startTimezoneId: true,
                },
            });

            checkPermission(ctx, ride.organizerId, 'You are not an organizer of the ride');

            const staticMapId =
                input.finish || input.start
                    ? await this.rideService.getStaticMapId(ctx, {
                          track: ride.track?.geojson,
                          startCoordinates: input.start?.location.coordinates ?? ride.startLocation.geojson.coordinates,
                          finishCoordinates: input.finish?.location.coordinates ?? ride.finishLocation?.geojson.coordinates,
                      })
                    : undefined;

            const { startDate, autoFinish } = await Ride.update(ctx.t, {
                pk: { id: input.id },
                patch: {
                    ...object.pick(input, ['bikeType', 'description', 'title', 'privacy', 'visibility', 'riderLevel']),
                    staticMapId,
                    startDate: input.startDate
                        ? zonedTimeToUtc(input.startDate, input.startTimezone?.id ?? ride.startTimezoneId)
                        : undefined,
                    startName: input.start?.name,
                    startLocation: input.start?.location,
                    startTimezoneId: input.startTimezone?.id,
                    startTimezoneName: input.startTimezone?.name,
                    finishName: input.finish?.name,
                    finishLocation: input.finish?.location,
                    autoStart: input.autoStart,
                    autoFinish: input.autoFinish,
                    chatLink: input.chatLink,
                    termsUrl: input.termsUrl?.trim() ?? null,
                },
                selector: ['id', 'startDate', 'autoFinish'],
            });

            await schedule(ctx.t, { key: '@ride/START', input: { rideId: input.id } }, { runAt: startDate, jobKey: input.id });

            if (ride.status === 'started' && ride.startedAt && autoFinish) {
                await schedule(
                    ctx.t,
                    { key: '@ride/FINISH', input: { rideId: input.id } },
                    { runAt: addMinutes(ride.startedAt, autoFinish), jobKey: input.id },
                );
            }
        },
    });

    public ['ride/get_preview'] = rpc({
        input: z.object({ id: z.string() }),
        resolve: async ({ ctx, input }) => {
            const distancesToStart = await ctx.t.sql<{ distanceToStart: number | null }>`
                SELECT ST_Distance(r.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id})) AS "distanceToStart"
                FROM rides AS r
                WHERE id = ${input.id}
            `.then((x) => x[0]?.distanceToStart ?? null);

            const [ride] = await this.rideService.getRidePreviews(ctx, {
                ids: [input.id],
                distancesToStart: {
                    [input.id]: distancesToStart,
                },
            });

            if (!ride) {
                throw new NotFoundError('Ride not found');
            }

            return ride;
        },
    });

    public ['ride/get'] = rpc({
        input: z.object({ id: z.string() }),
        resolve: async ({ ctx, input }) => {
            const [ride, participantStatus, distanceToStart, participantsCounts] = await Promise.all([
                Ride.findByPkOrError(ctx.t, {
                    pk: { id: input.id },
                    selector: {
                        id: true,
                        staticMap: File.Selector,
                        organizer: { ...User.Selector, location: GeoJsonSelector },
                        startDate: true,
                        startName: true,
                        startLocation: GeoJsonSelector,
                        startTimezoneId: true,
                        startTimezoneName: true,
                        finishName: true,
                        finishLocation: GeoJsonSelector,
                        track: GeoJsonSelector,
                        elevationProfile: File.Selector,
                        manualDistance: true,
                        calculatedDistance: true,
                        riderLevel: true,
                        bikeType: true,
                        status: true,
                        privacy: true,
                        visibility: true,
                        gpxTrackId: true,
                        gpxTrack: { file: { url: true } },
                        trackSource: true,
                        trackSourceUrl: true,
                        description: true,
                        title: true,
                        chatLink: true,
                        bbox: true,
                        elevation: true,
                        startedAt: true,
                        finishedAt: true,
                        autoStart: true,
                        autoFinish: true,
                        termsUrl: true,
                        users2RidesConnection: {
                            selector: { nodes: { user: User.Selector } },
                            filter: { status: { equalTo: 'approved' } },
                            first: 5,
                        },
                    },
                }),
                Users2Ride.findByPk(ctx.t, {
                    pk: { rideId: input.id, userId: ctx.user.id },
                    selector: ['status'],
                }),
                ctx.t.sql<{ distanceToStart: number | null }>`
                    SELECT ST_Distance(r.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id})) as "distanceToStart"
                    FROM rides AS r
                    JOIN users AS u ON u.id = ${ctx.user.id} AND r.id = ${input.id}
                `.then((x) => x[0]?.distanceToStart ?? null),
                ctx.t.sql<{ status: ParticipantStatus; count: number }>`
                    SELECT
                          u2r.status as "status"
                        , count(*) as "count"
                    FROM users2rides u2r
                    WHERE u2r.ride_id = ${input.id}
                    GROUP BY u2r.status
                `,
            ]);

            return {
                ...object.pick(ride, [
                    'id',
                    'bikeType',
                    'description',
                    'title',
                    'chatLink',
                    'manualDistance',
                    'calculatedDistance',
                    'elevationProfile',
                    'privacy',
                    'riderLevel',
                    'staticMap',
                    'status',
                    'visibility',
                    'gpxTrackId',
                    'trackSource',
                    'trackSourceUrl',
                    'bbox',
                    'elevation',
                    'startedAt',
                    'finishedAt',
                    'autoStart',
                    'autoFinish',
                    'termsUrl',
                ]),
                gpxTrackUrl: ride.gpxTrack?.file.url ?? null,
                startDate: ride.startDate.toISOString(),
                localStartDateString: format(utcToZonedTime(ride.startDate, ride.startTimezoneId), `dd MMMM 'at' p`),
                start: { name: ride.startName, location: ride.startLocation.geojson },
                startTimezone: { id: ride.startTimezoneId, name: ride.startTimezoneName },
                finish:
                    ride.finishName && ride.finishLocation
                        ? { name: ride.finishName, location: ride.finishLocation.geojson }
                        : null,
                track: ride.track?.geojson ?? null,
                distanceToStart,
                participantPick: ride.users2RidesConnection.nodes.map((x) => x.user),
                participantStatus: participantStatus?.status ?? null,
                participantsCounts: array.reduceBy(
                    participantsCounts,
                    (x) => x.status,
                    (x) => x.count,
                ),
                isEditable: isRideEditable(ride),
                isOrganizer: ctx.user.id === ride.organizer.id,
                organizer: {
                    ...object.pick(ride.organizer, ['id', 'avatar', 'name']),
                    location:
                        ride.organizer.location && ride.organizer.locationName
                            ? { name: ride.organizer.locationName, location: ride.organizer.location?.geojson }
                            : null,
                },
                pushTitle: getRidePushTitle(ride),
            };
        },
    });

    public ['ride/active_rides_count'] = rpc({
        resolve: async ({ ctx }) => {
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
        },
    });

    public ['ride/meta_data'] = rpc({
        anonymous: true,
        input: z.object({
            id: z.string(),
        }),
        resolve: async ({ ctx, input }) => {
            const ride = await Ride.findByPkOrError(ctx.t, {
                pk: { id: input.id },
                selector: {
                    id: true,
                    staticMap: File.Selector,
                    organizer: { ...User.Selector, location: GeoJsonSelector },
                    startDate: true,
                    startName: true,
                    startLocation: GeoJsonSelector,
                    startTimezoneId: true,
                    startTimezoneName: true,
                    finishName: true,
                    finishLocation: GeoJsonSelector,
                    track: GeoJsonSelector,
                    elevationProfile: File.Selector,
                    manualDistance: true,
                    calculatedDistance: true,
                    riderLevel: true,
                    bikeType: true,
                    status: true,
                    privacy: true,
                    visibility: true,
                    gpxTrackId: true,
                    gpxTrack: { file: { url: true } },
                    trackSource: true,
                    trackSourceUrl: true,
                    description: true,
                    title: true,
                    chatLink: true,
                    bbox: true,
                    elevation: true,
                    startedAt: true,
                    finishedAt: true,
                    autoStart: true,
                    autoFinish: true,
                    users2RidesConnection: {
                        selector: { nodes: { user: User.Selector } },
                        filter: { status: { equalTo: 'approved' } },
                        first: 5,
                    },
                },
            });

            return {
                ...object.pick(ride, [
                    'id',
                    'bikeType',
                    'description',
                    'chatLink',
                    'manualDistance',
                    'calculatedDistance',
                    'elevationProfile',
                    'privacy',
                    'riderLevel',
                    'staticMap',
                    'status',
                    'visibility',
                    'gpxTrackId',
                    'trackSource',
                    'trackSourceUrl',
                    'bbox',
                    'elevation',
                    'startedAt',
                    'finishedAt',
                    'autoStart',
                    'autoFinish',
                ]),
                title: getRidePushTitle(ride),
                participantPick: ride.users2RidesConnection.nodes.map((x) => x.user),
                gpxTrackUrl: ride.gpxTrack?.file.url ?? null,
                startDate: ride.startDate.toISOString(),
                localStartDateString: format(utcToZonedTime(ride.startDate, ride.startTimezoneId), `dd MMMM 'at' p`),
                start: { name: ride.startName, location: ride.startLocation.geojson },
                startTimezone: { id: ride.startTimezoneId, name: ride.startTimezoneName },
                finish:
                    ride.finishName && ride.finishLocation
                        ? { name: ride.finishName, location: ride.finishLocation.geojson }
                        : null,
                track: ride.track?.geojson ?? null,
                organizer: {
                    ...object.pick(ride.organizer, ['id', 'avatar', 'name']),
                    location:
                        ride.organizer.location && ride.organizer.locationName
                            ? { name: ride.organizer.locationName, location: ride.organizer.location?.geojson }
                            : null,
                },
            };
        },
    });

    public ['ride/find'] = rpc({
        input: z.object({
            filter: z.object({
                riderLevel: RiderLevel.nullable().optional(),
                bikeType: BikeType.nullable().optional(),
                distance: z.tuple([z.number(), z.number()]).nullable().optional(),
                distanceToStart: z.number().nullable().optional(),
                publicOnly: z.boolean().optional(),
                followsOnly: z.boolean().optional(),
                organizerId: z.string().optional(),
                participantId: z.string().optional(),
                bbox: z.tuple([Position, Position]).optional(),
                status: RideStatus.optional(),
                fromDate: DateSchema.optional(),
                toDate: DateSchema.optional(),
                active: z.boolean().optional(),
                allowClusters: z.boolean().optional(),
            }),
            orderBy: z
                .tuple([
                    z.union([z.literal('start_date'), z.literal('created_at')]),
                    z.union([z.literal('DESC'), z.literal('ASC')]),
                ]) // TODO implement ordering
                .optional(),
            page: PageSchema,
        }),
        resolve: async ({ ctx, input }) => {
            const {
                bikeType = null,
                distance = null,
                distanceToStart = null,
                // date = null,
                // followsOnly = false,
                participantId = null,
                active = null,
                publicOnly = false,
                riderLevel = null,
                organizerId = null,
                bbox = null,
                status = null,
                fromDate = null,
                toDate = null,
                allowClusters = true,
            } = input.filter;

            const page = createPager(input.page, 10);

            type RideRow = { type: 'ride'; id: string; distanceToStart: number | null };
            type UserRow = { type: 'user'; id: string };
            type ClusterRow = { type: 'cluster'; count: number; center: Point; bbox: BoundingBox | null };
            type Row = UserRow | RideRow | ClusterRow;

            const isGeoSearch = Boolean(bbox) && allowClusters;

            const ne: Point = {
                type: 'Point',
                coordinates: bbox ? bbox[0] : [0, 0],
            };

            const sw: Point = {
                type: 'Point',
                coordinates: bbox ? bbox[1] : [0, 0],
            };

            const minLon = bbox?.[1][0] ?? 0;
            const minLat = bbox?.[1][1] ?? 0;
            const maxLon = bbox?.[0][0] ?? 0;
            const maxLat = bbox?.[0][1] ?? 0;

            // prettier-ignore
            const rows = await ctx.t.sql<Row>`
                WITH filtered_rides AS (
                    SELECT
                        q.id
                        , 'ride' AS type
                        , q.distance_to_start
                        , q.start_location
                        , q.start_date -- not a real start_date
                        , q.status_order
                    FROM (
                        SELECT 
                            DISTINCT ON (r.id) r.id
                            , ST_Distance(r.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id})) AS distance_to_start
                            , COALESCE(r.started_at, r.start_date) as start_date
                            , CASE WHEN r.status = 'created' OR r.status = 'started' THEN 1 ELSE 0 END AS status_order
                            , r.start_location
                        FROM rides AS r
                        LEFT JOIN users2rides AS u2r ON u2r.ride_id = r.id
                        WHERE TRUE 
                            AND (${participantId}::uuid IS NULL OR (u2r.user_id = ${participantId}::uuid AND u2r.status = 'approved'))
                            AND (${Boolean(active)} = FALSE OR TRUE
                                AND ((u2r.user_id = ${ctx.user.id} AND u2r.status = 'approved') OR r.organizer_id = ${ctx.user.id})
                                AND (r.status = 'started' OR (r.status = 'created' AND now() + interval '3 hour' >= r.start_date))
                            )
                            AND (${status}::text IS NULL OR r.status = ${status}::text)
                            AND (${fromDate}::timestamptz IS NULL OR r.start_date >= ${fromDate}::timestamptz)
                            AND (${toDate}::timestamptz IS NULL OR r.start_date <= ${toDate}::timestamptz)
                            AND (${riderLevel}::text IS NULL OR r.rider_level = ${riderLevel}::text)
                            AND (${bikeType}::text IS NULL OR r.bike_type = ${bikeType}::text)
                            AND (${distanceToStart}::double precision IS NULL OR ST_DWithin(r.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id}), ${distanceToStart}::double precision))
                            AND (${Boolean(distance)} = FALSE OR (COALESCE(r.manual_distance, r.calculated_distance) BETWEEN ${distance?.[0] ?? 0} AND ${distance?.[1] ?? 0}))
                            AND (${publicOnly} = FALSE OR r.privacy = 'public')
                            AND (${organizerId}::uuid IS NULL OR r.organizer_id = ${organizerId})
                            AND (${Boolean(bbox)} = FALSE OR r.start_location && ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}))
                        ORDER BY r.id
                    ) AS q
                ),
                user_with_locations AS (
                    SELECT
                        q.id,
                        q.location
                    FROM (
                        SELECT
                            u.id,
                            CASE WHEN u.use_current_location THEN ud.location ELSE u.location END AS location
                        FROM users AS u
                        JOIN user_sessions AS ud ON ud.user_id = u.id
                        WHERE u.is_anonymous = FALSE
                            
                    ) AS q
                    WHERE TRUE 
                        AND q.location IS NOT NULL
                        AND q.location && ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat})
                ),
                clustered_items AS (
                    SELECT 
                          CASE WHEN q2.count = 1 THEN q2.id ELSE NULL END AS id
                        , CASE WHEN q2.count = 1 THEN q2.type ELSE 'cluster' END AS type
                        , CASE WHEN q2.count = 1 THEN NULL ELSE ST_AsGeoJSON(q2.center)::jsonb END AS center
                        , CASE WHEN q2.count = 1 THEN NULL ELSE q2.bbox END AS bbox
                        , CASE WHEN q2.count = 1 THEN NULL ELSE q2.count END AS count
                        , CASE WHEN q2.count = 1 THEN q2.distance_to_start ELSE NULL END AS distance_to_start
                    FROM (
                        SELECT DISTINCT ON (q1.cluster_id)
                            q1.id
                            , q1.type
                            , q1.distance_to_start
                            , count(q1.id) over (PARTITION BY cluster_id) AS count
                            , ST_Centroid(ST_Collect(q1.location::geometry) OVER (PARTITION BY q1.cluster_id)) AS center
                            , get_bbox(ST_Collect(q1.location::geometry) OVER (PARTITION BY q1.cluster_id)) AS bbox
                        FROM (
                            SELECT
                                ST_ClusterDBSCAN(
                                    r.location::geometry, 
                                    ST_Distance(
                                        ST_GeomFromGeoJSON(${JSON.stringify(ne)}), 
                                        ST_GeomFromGeoJSON(${JSON.stringify(sw)})
                                    ) * 0.028, -- clustering parameter
                                    1
                                ) OVER() AS cluster_id
                                , r.type
                                , r.id
                                , r.location
                                , r.distance_to_start
                            FROM (
                                SELECT 
                                    'ride' AS type,
                                    r.id,
                                    r.start_location AS location,
                                    r.distance_to_start
                                FROM filtered_rides AS r
                                UNION ALL
                                SELECT
                                    'user' AS type,
                                    u.id,
                                    u.location,
                                    NULL as distance_to_start
                                FROM user_with_locations AS u 
                            ) AS r
                        ) AS q1
                        ORDER BY cluster_id DESC
                    ) q2
                ),
                list_search AS (
                    SELECT *
                    FROM filtered_rides
                    ORDER BY status_order DESC, ABS(EXTRACT(EPOCH FROM (start_date - now()))) ASC
                    LIMIT ${page.limit}
                    OFFSET ${page.offset}
                ),
                geo_search AS (
                    SELECT *
                    FROM clustered_items
                )
                SELECT *, distance_to_start AS "distanceToStart"
                FROM "${raw(isGeoSearch ? 'geo_search' : 'list_search')}"
            `;

            const clusters: ClusterRow[] = [];
            const rides: RideRow[] = [];
            let users: UserRow[] = [];

            if (bbox && !isGeoSearch) {
                users = await ctx.t.sql<UserRow>`
                    SELECT
                        q.id,
                        q.location,
                        'user' as type
                    FROM (
                        SELECT
                            u.id,
                            CASE WHEN u.use_current_location THEN ud.location ELSE u.location END AS location
                        FROM users AS u
                        JOIN user_sessions AS ud ON ud.user_id = u.id
                        WHERE u.is_anonymous = FALSE
                            
                    ) AS q
                    WHERE TRUE 
                        AND q.location IS NOT NULL
                        AND q.location && ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat})
                `;
            }

            for (const row of rows) {
                switch (row.type) {
                    case 'ride':
                        rides.push(row);
                        break;
                    case 'cluster':
                        clusters.push(row);
                        break;
                    case 'user': {
                        users.push(row);
                        break;
                    }

                    default:
                        break;
                }
            }

            const { items: lookupList, hasMore } = isGeoSearch ? { items: rides, hasMore: false } : page.slice(rides);
            const ids: string[] = [];
            const distancesToStart: Record<string, number | null> = {};

            for (const item of lookupList) {
                ids.push(item.id);
                distancesToStart[item.id] = item.distanceToStart;
            }

            const userCoordinates = await ctx.t.sql<{ id: string; location: Point }>`
                SELECT q.id, ST_AsGeoJSON(q.location)::jsonb as "location"
                FROM (
                    SELECT
                        u.id,
                        CASE WHEN u.use_current_location THEN ud.location ELSE u.location END AS location
                    FROM
                        users AS u
                        JOIN user_sessions AS ud ON ud.user_id = u.id
                    WHERE u.id = ANY(${users.map((x) => x.id)})
                ) AS q
                WHERE q.location IS NOT NULL`.then((res) => {
                return array.reduceBy(
                    res,
                    (x) => x.id,
                    (x) => x.location,
                );
            });

            const userItems = await User.find(ctx.t, {
                selector: User.Selector,
                filter: { id: { in: users.map((x) => x.id) } },
            }).then((x) => {
                return x
                    .map((user) => ({
                        type: 'user' as const,
                        id: user.id,
                        location: userCoordinates[user.id] as Point,
                        user,
                    }))
                    .filter((x) => x.location != null);
            });

            const rideItems = array
                .orderAs(ids, await this.rideService.getRidePreviews(ctx, { ids, distancesToStart }), (x) => x.id)
                .map((ride) => ({ type: 'ride' as const, id: ride.id, location: ride.startLocation, ride }));

            return {
                items: [...userItems, ...rideItems],
                clusters: clusters.map((x) => object.pick(x, ['count', 'center', 'bbox'])),
                hasMore,
            };
        },
    });
}

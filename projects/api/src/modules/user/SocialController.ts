import { SelectorShape } from '@untype/orm';
import { raw } from '@untype/pg';
import { InvalidOperationError, array, assert, object, string, uuid } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { File, Follow, GeoJsonSelector, RideImage, User, Users2Ride } from '../../entities';
import { navigationAction } from '../models/shared';
import { UserVm } from '../models/users';
import { PageSchema, createPager } from '../models/utils';
import { NotificationService } from '../push/NotificationService';
import { RidePreviewVm, RideService } from '../rides/RideService';
import { ParticipantStatus } from '../rides/models';
import { rpc } from '../rpc';
import { Context } from '../rpc/models';

@singleton()
export class SocialController {
    public constructor(
        private notificationService: NotificationService,
        private rideService: RideService,
    ) {}

    public ['social/find_friends'] = rpc({
        input: z.object({
            query: z.string(),
            direction: z.union([z.literal('following'), z.literal('followedBy')]),
            userId: z.string(),
            page: PageSchema,
        }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(input.page, 25);
            const query = string.trimToNull(input.query);
            if (query?.startsWith('@')) {
                query.substring(1);
            }

            // prettier-ignore
            const rows = await ctx.t.sql<{ id: string; following: boolean; followedBy: boolean }>`
                SELECT 
                      u.id AS "id"
                    , u2f IS NOT NULL AS "following"
                    , f2u IS NOT NULL AS "followedBy"
                FROM users AS u
                JOIN follows AS f ON f."${raw(input.direction === 'followedBy' ? 'user_id' : 'following_id')}" = u.id
                LEFT JOIN follows AS u2f ON u2f.user_id = ${ctx.user.id} AND u2f.following_id = u.id
                LEFT JOIN follows AS f2u ON f2u.following_id = ${ctx.user.id} AND f2u.user_id = u.id
                WHERE TRUE
                    AND f."${raw(input.direction === 'followedBy' ? 'following_id' : 'user_id')}" = ${input.userId}
                    AND (${query}::text IS NULL OR (u.name %> ${query} OR u.slug %> ${query}))
                    AND u.is_anonymous = FALSE
                ORDER BY GREATEST(similarity(${query}::text, u.slug), similarity(${query}, u.name)) DESC 
                LIMIT ${pager.limit}
                OFFSET ${pager.offset}
            `;

            const { items: ids, hasMore } = pager.slice(rows);
            const map = array.reduceBy(ids, (x) => x.id);

            const items = await User.find(ctx.t, {
                filter: { id: { in: Object.keys(map) } },
                selector: User.Selector,
            });

            return {
                items: items.map((user) => ({
                    user,
                    friendshipStatus: {
                        following: map[user.id]?.following ?? false,
                        followedBy: map[user.id]?.followedBy ?? false,
                    },
                })),
                hasMore,
            };
        },
    });

    public ['social/find_users'] = rpc({
        input: z.object({ query: z.string(), page: PageSchema }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(input.page, 25);
            const query = string.trimToNull(input.query);

            // prettier-ignore
            const rows = await ctx.t.sql<{ id: string; following: boolean; followedBy: boolean }>`
                SELECT
                      u.id AS "id"
                    , u2f IS NOT NULL AS "following"
                    , f2u IS NOT NULL AS "followedBy"
                FROM users AS u
                LEFT JOIN follows AS u2f ON u2f.user_id = ${ctx.user.id} AND u2f.following_id = u.id
                LEFT JOIN follows AS f2u ON f2u.following_id = ${ctx.user.id} AND f2u.user_id = u.id
                WHERE TRUE
                    AND (${query}::text IS NULL OR (u.name %> ${query} OR u.slug %> ${query}))
                    AND (${query}::text IS NOT NULL OR u2f.following_id IS NOT NULL)
                    AND u.is_anonymous = FALSE
                    AND u.id != ${ctx.user.id}
                ORDER BY GREATEST(similarity(${query}::text, u.slug), similarity(${query}, u.name)) DESC 
                LIMIT ${pager.limit}
                OFFSET ${pager.offset}
            `;

            const { items: ids, hasMore } = pager.slice(rows);
            const map = array.reduceBy(ids, (x) => x.id);

            const items = await User.find(ctx.t, {
                filter: { id: { in: Object.keys(map) } },
                selector: User.Selector,
            });

            return {
                items: items.map((user) => ({
                    user,
                    friendshipStatus: {
                        following: map[user.id]?.following ?? false,
                        followedBy: map[user.id]?.followedBy ?? false,
                    },
                })),
                hasMore,
            };
        },
    });

    public ['social/change_friendship_status'] = rpc({
        input: z.object({
            userId: z.string(),
            action: z.union([z.literal('follow'), z.literal('unfollow')]),
        }),
        resolve: async ({ ctx, input }) => {
            const pk = { userId: ctx.user.id, followingId: input.userId };
            const exists = await Follow.existsByPk(ctx.t, { pk });

            switch (input.action) {
                case 'follow': {
                    if (!exists) {
                        const { user } = await Follow.create(ctx.t, { item: pk, selector: { user: ['id', 'name'] } });
                        this.notificationService.sendMessagesByUserSilent({
                            userId: input.userId,
                            notification: {
                                title: `${user.name} is now following you`,
                                body: '🤝 You can follow back and go for a ride together.',
                                action: navigationAction('user', user.id),
                            },
                        });
                        return;
                    }
                    break;
                }
                case 'unfollow': {
                    if (exists) {
                        await Follow.delete(ctx.t, { pk });
                        return;
                    }
                    break;
                }
                default:
                    assert.never(input.action);
            }

            throw new InvalidOperationError('Something went wrong');
        },
    });

    public ['social/get_user_info'] = rpc({
        input: z.object({ id: z.string() }),
        resolve: async ({ ctx, input }) => {
            const [item, friendshipStatus] = await Promise.all([
                User.findFirstOrError(ctx.t, {
                    filter: uuid.isUUID(input.id) ? { id: { equalTo: input.id } } : { slug: { equalTo: input.id } },
                    selector: {
                        id: true,
                        avatar: File.Selector,
                        bikeType: true,
                        level: true,
                        bio: true,
                        location: GeoJsonSelector,
                        locationName: true,
                        name: true,
                        slug: true,
                        website: true,
                        useCurrentLocation: true,
                        usersByFollowUserIdAndFollowingId: { selector: ['totalCount'] },
                        usersByFollowFollowingIdAndUserId: { selector: ['totalCount'] },
                        users2RidesConnection: {
                            filter: { status: { equalTo: 'approved' } },
                            selector: ['totalCount'],
                        },
                        ridesByOrganizerIdConnection: {
                            filter: { status: { in: ['started', 'finished', 'created'] } },
                            selector: ['totalCount'],
                        },
                    },
                }),
                this.friendshipStatus(ctx, [input.id]),
            ]);

            return {
                ...object.pick(item, ['id', 'avatar', 'bikeType', 'bio', 'location', 'name', 'website', 'level', 'slug']),
                location:
                    item.location && item.locationName && !item.useCurrentLocation
                        ? { name: item.locationName, location: item.location.geojson }
                        : null,
                stats: {
                    rides: item.users2RidesConnection.totalCount + item.ridesByOrganizerIdConnection.totalCount,
                    followers: item.usersByFollowFollowingIdAndUserId.totalCount,
                    follows: item.usersByFollowUserIdAndFollowingId.totalCount,
                },
                friendshipStatus: friendshipStatus[input.id]!,
            };
        },
    });

    public ['social/get_user_photos'] = rpc({
        input: z.object({ userId: z.string(), page: PageSchema }),
        resolve: async ({ ctx, input }) => {
            const items = await RideImage.find(ctx.t, {
                filter: { userId: { equalTo: input.userId } },
                selector: { id: true, file: File.Selector, description: true, user: User.Selector, createdAt: true },
                orderBy: [['createdAt', 'DESC']],
            });

            return { items, hasMore: false };
        },
    });

    public ['social/get_feed'] = rpc({
        input: z.object({ page: PageSchema, type: z.string() }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(input.page, 25);

            type EventRow =
                | { date: Date; type: 'follow'; data: { userId: string } }
                | { date: Date; type: 'ride_status'; data: { rideId: string } }
                | { date: Date; type: 'friend_ride'; data: { rideId: string } }
                | { date: Date; type: 'ride_nearby'; data: { rideId: string } }
                | { date: Date; type: 'ride_image'; data: { imageId: string; userId: string } };

            const rows = await ctx.t.sql<EventRow>`
                SELECT updated_at as "date"
                     , 'follow' as "type"
                     , json_build_object('userId', f.user_id) AS "data" 
                FROM follows AS f 
                WHERE f.following_id = ${ctx.user.id}

                UNION ALL

                SELECT updated_at as "date"
                     , 'ride_status' as "type"
                     , json_build_object('rideId', u2r.ride_id) AS "data" 
                FROM users2rides AS u2r
                WHERE TRUE 
                    AND u2r.user_id = ${ctx.user.id}
                    AND u2r.status != 'left'

                UNION ALL

                SELECT r.created_at AS "date"
                     , 'friend_ride' as "type"
                     , json_build_object('rideId', r.id) as "data" 
                FROM rides AS r
                JOIN follows AS f ON f.following_id = r.organizer_id
                WHERE TRUE 
                    AND f.user_id = ${ctx.user.id}
                    AND r.status = 'created'

                UNION ALL

                SELECT r.created_at AS "date"
                     , 'ride_nearby' as "type"
                     , json_build_object('rideId', r.id) AS "data" 
                FROM rides AS r
                JOIN users AS u ON TRUE
                WHERE TRUE
                    AND u.id = ${ctx.user.id}
                    AND ST_DWithin (r.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id}), 5000)
                    AND r.status = 'created'

                UNION ALL

                SELECT ri.created_at AS "date"
                     , 'ride_image' as "type"
                     , json_build_object('imageId', ri.id, 'userId', ri.user_id) AS "data"
                FROM follows AS f
                JOIN users AS u ON u.id = f.user_id
                JOIN ride_images ri ON ri.user_id = f.following_id
                WHERE u.id = ${ctx.user.id}
                
                ORDER BY "date" DESC
                LIMIT ${pager.limit}
                OFFSET ${pager.offset}
            `;

            const rideIds = new Set<string>();
            const user2rideIds = new Set<string>();
            const userIds = new Set<string>();
            const imageIds = new Set<string>();
            const friendshipStatusIds = new Set<string>();
            const friendsRide = new Set<string>();

            const { items: events, hasMore } = pager.slice(rows);

            for (const event of events) {
                switch (event.type) {
                    case 'ride_status':
                        user2rideIds.add(event.data.rideId);
                        rideIds.add(event.data.rideId);
                        break;
                    case 'ride_nearby':
                        rideIds.add(event.data.rideId);
                        break;
                    case 'friend_ride':
                        rideIds.add(event.data.rideId);
                        friendsRide.add(event.data.rideId);
                        break;
                    case 'follow':
                        userIds.add(event.data.userId);
                        friendshipStatusIds.add(event.data.userId);
                        break;
                    case 'ride_image':
                        imageIds.add(event.data.imageId);
                        userIds.add(event.data.userId);
                        break;
                }
            }

            const [users, user2rides, rides, images, friendshipStatus] = await Promise.all([
                User.find(ctx.t, { filter: { id: { in: [...userIds] } }, selector: User.Selector }).then((res) => {
                    const tmp = array.reduceBy(res, (x) => x.id);
                    return tmp;
                }),
                Users2Ride.find(ctx.t, {
                    filter: { and: [{ userId: { equalTo: ctx.user.id } }, { rideId: { in: [...user2rideIds] } }] },
                    selector: { status: true, user: User.Selector, rideId: true },
                }).then((res) => {
                    const tmp = array.reduceBy(res, (x) => x.rideId);
                    return tmp;
                }),
                this.rideService.getRidePreviews(ctx, { ids: [...rideIds], distancesToStart: {} }).then((res) => {
                    const tmp = array.reduceBy(res, (x) => x.id);
                    return tmp;
                }),
                RideImage.find(ctx.t, {
                    filter: { id: { in: [...imageIds] } },
                    selector: { id: true, file: File.Selector, userId: true, description: true, createdAt: true },
                    orderBy: [['createdAt', 'DESC']],
                }),
                this.friendshipStatus(ctx, [...friendshipStatusIds]),
            ]);

            const imageEvents = array.groupBy(images, (x) => x.userId);

            type SocialEvent =
                | {
                      type: 'ride_status';
                      date: Date;
                      data: { status: ParticipantStatus; user: UserVm; ride: RidePreviewVm };
                  }
                | {
                      type: 'ride_nearby';
                      date: Date;
                      data: { rides: RidePreviewVm[] };
                  }
                | {
                      type: 'friend_ride';
                      date: Date;
                      data: { rides: RidePreviewVm[] };
                  }
                | {
                      type: 'follow';
                      date: Date;
                      data: {
                          users: Array<{
                              user: UserVm;
                              friendshipStatus: { following: boolean; followedBy: boolean };
                          }>;
                      };
                  }
                | {
                      type: 'ride_image';
                      date: Date;
                      data: {
                          user: UserVm;
                          images: Array<{
                              id: string;
                              user: UserVm;
                              file: SelectorShape<File, typeof File.Selector>;
                              description: string | null;
                              createdAt: Date;
                          }>;
                      };
                  };

            const items: SocialEvent[] = [];
            let nearbyEvent: Extract<SocialEvent, { type: 'ride_nearby' }> | undefined;
            let friendRideEvent: Extract<SocialEvent, { type: 'friend_ride' }> | undefined;
            let followEvent: Extract<SocialEvent, { type: 'follow' }> | undefined;

            for (const event of events) {
                switch (event.type) {
                    case 'ride_status': {
                        const u2r = user2rides[event.data.rideId];
                        if (u2r) {
                            const ride = rides[u2r.rideId];
                            if (ride) {
                                items.push({
                                    type: 'ride_status',
                                    date: event.date,
                                    data: {
                                        status: u2r.status,
                                        user: u2r.user,
                                        ride,
                                    },
                                });
                            }
                        }

                        break;
                    }
                    case 'ride_nearby': {
                        const ride = rides[event.data.rideId];
                        if (ride && !friendsRide.has(ride.id)) {
                            if (!nearbyEvent) {
                                nearbyEvent = {
                                    type: 'ride_nearby',
                                    date: event.date,
                                    data: { rides: [] },
                                };

                                items.push(nearbyEvent);
                            }

                            nearbyEvent.data.rides.push(ride);
                        }

                        break;
                    }
                    case 'friend_ride': {
                        const ride = rides[event.data.rideId];
                        if (ride) {
                            if (!friendRideEvent) {
                                friendRideEvent = {
                                    type: 'friend_ride',
                                    date: event.date,
                                    data: { rides: [] },
                                };

                                items.push(friendRideEvent);
                            }

                            friendRideEvent.data.rides.push(ride);
                        }

                        break;
                    }
                    case 'follow': {
                        const user = users[event.data.userId];
                        if (user) {
                            if (!followEvent) {
                                followEvent = {
                                    type: 'follow',
                                    date: event.date,
                                    data: { users: [] },
                                };

                                items.push(followEvent);
                            }

                            followEvent.data.users.push({ user, friendshipStatus: friendshipStatus[user.id]! });
                        }
                        break;
                    }
                    case 'ride_image': {
                        const images = imageEvents[event.data.userId];
                        const user = users[event.data.userId];
                        if (images && user) {
                            items.push({
                                type: 'ride_image',
                                date: event.date,
                                data: {
                                    user,
                                    images: images.map((x) => ({
                                        id: x.id,
                                        description: x.description,
                                        createdAt: x.createdAt,
                                        user,
                                        file: x.file,
                                    })),
                                },
                            });

                            delete imageEvents[event.data.userId];
                        }
                        break;
                    }
                }
            }

            return { items, hasMore };
        },
    });

    public friendshipStatus = async (ctx: Context, ids: string[]) => {
        const [following, followedBy] = await Promise.all([
            Follow.find(ctx.t, {
                filter: { userId: { equalTo: ctx.user.id }, followingId: { in: ids } },
                selector: ['followingId'],
            }).then((res) =>
                array.reduceBy(
                    res,
                    (x) => x.followingId,
                    () => true,
                ),
            ),
            Follow.find(ctx.t, {
                filter: { followingId: { equalTo: ctx.user.id }, userId: { in: ids } },
                selector: ['userId'],
            }).then((res) =>
                array.reduceBy(
                    res,
                    (x) => x.userId,
                    () => true,
                ),
            ),
        ]);

        return ids.reduce(
            (acc, id) => {
                acc[id] = {
                    following: following[id] ?? false,
                    followedBy: followedBy[id] ?? false,
                };
                return acc;
            },
            {} as Record<string, { following: boolean; followedBy: boolean }>,
        );
    };
}

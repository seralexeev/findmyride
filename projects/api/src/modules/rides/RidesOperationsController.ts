import { raw } from '@untype/pg';
import { BadRequestError, UnreachableError, array, string } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { Ride, User, Users2Ride } from '../../entities';
import { ChatService } from '../chat/ChatService';
import { navigationAction } from '../models/shared';
import { PageSchema, checkPermission, createPager } from '../models/utils';
import { NotificationService } from '../push/NotificationService';
import { getRidePushTitle } from '../push/utils';
import { rpc } from '../rpc';
import { RideOperationsService } from './RideOperationsService';
import { ParticipantStatus, RideAction, isRideEditable } from './models';

@singleton()
export class RidesOperationsController {
    public constructor(
        private operationsService: RideOperationsService,
        private notificationService: NotificationService,
        private chatService: ChatService,
    ) {}

    public ['ride_ops/find_participants'] = rpc({
        input: z.object({
            query: z.string(),
            rideId: z.string(),
            friends: z.boolean().optional(),
            page: PageSchema,
        }),
        resolve: async ({ ctx, input }) => {
            const pager = createPager(input.page, 25);
            const query = string.trimToNull(input.query);
            if (query?.startsWith('@')) {
                query.substring(1);
            }

            const rows = await ctx.t.sql<{ id: string; status: ParticipantStatus | null }>`
                SELECT u.id AS "id", u2r.status AS "status"
                FROM users AS u
                JOIN rides as r ON r.id = ${input.rideId}
                LEFT JOIN users2rides AS u2r ON u2r.user_id = u.id AND u2r.ride_id = ${input.rideId}
                LEFT JOIN follows AS f ON f.following_id = u.id AND f.user_id = ${ctx.user.id}
                WHERE TRUE
                    AND u.is_anonymous = FALSE
                    AND u.id != r.organizer_id
                    AND (${query}::text IS NULL OR (u.name %> ${query} OR u.slug %> ${query}))
                    AND (${query}::text IS NOT NULL OR "${raw(input.friends ? 'f' : 'u2r')}" is NOT NULL)
                ORDER BY 
                      GREATEST(similarity(${query}::text, u.slug), similarity(${query}, u.name)) DESC
                    , u2r.created_at DESC
                    , u.created_at
                LIMIT ${pager.limit}
                OFFSET ${pager.offset}
            `;

            const { items: ids, hasMore } = pager.slice(rows);
            const statuses = array.reduceBy(
                ids,
                (x) => x.id,
                (x) => x.status,
            );

            const users = await User.find(ctx.t, {
                filter: { id: { in: Object.keys(statuses) } },
                selector: User.Selector,
            });

            return {
                items: users.map((user) => ({ user, status: statuses[user.id] ?? null })),
                hasMore,
            };
        },
    });

    public ['ride_ops/join_leave'] = rpc({
        input: z.object({
            rideId: z.string(),
            action: z.union([z.literal('join'), z.literal('leave'), z.literal('accept'), z.literal('refuse')]),
        }),
        resolve: async ({ ctx, input: { rideId, action } }) => {
            const ride = await Ride.findByPkOrError(ctx.t, {
                selector: ['status', 'privacy', 'organizerId'],
                pk: { id: rideId },
            });

            if (!isRideEditable(ride)) {
                throw new BadRequestError(`Ride is in the ${ride.status} status`);
            }

            if (ride.organizerId === ctx.user.id) {
                throw new BadRequestError('You are the organizer of the ride');
            }

            const pk = { rideId, userId: ctx.user.id };

            const status = await Users2Ride.findByPk(ctx.t, {
                pk,
                selector: { status: true },
            }).then((x) => x?.status);

            if (status === 'declined') {
                throw new BadRequestError('You have declined the invitation');
            }

            switch (action) {
                case 'refuse': {
                    if (status === 'invited') {
                        await Users2Ride.update(ctx.t, {
                            pk,
                            patch: { status: 'refused' },
                        });

                        await ctx.t.sql`
                            INSERT INTO user2rooms (user_id, room_id) 
                            VALUES (${ctx.user.id}, ${rideId}) 
                            ON CONFLICT (user_id, room_id) DO NOTHING
                        `;

                        await this.chatService.kickFromRoom(ctx, { roomId: rideId, userId: ctx.user.id });

                        return;
                    }
                    break;
                }
                case 'accept': {
                    if (status === 'invited') {
                        const { user } = await Users2Ride.update(ctx.t, {
                            pk,
                            patch: { status: ride.privacy === 'private' ? 'pending' : 'approved' },
                            selector: { user: ['id', 'name'] },
                        });

                        await this.chatService.addToRoom(ctx, { roomId: rideId, userId: user.id });

                        this.notificationService.sendMessagesByUserSilent({
                            userId: ride.organizerId,
                            notification: {
                                title: `${user.name} has joined the ride via invite`,
                                body: `➕ It's almost a peloton! Invite someone else.`,
                                action: navigationAction('user', user.id),
                            },
                        });

                        return;
                    }
                    break;
                }
                case 'join': {
                    if (!status || status === 'left' || status === 'refused') {
                        const status = ride.privacy === 'private' ? 'pending' : 'approved';

                        const [{ user }] = await Users2Ride.updateOrCreate(ctx.t, {
                            pk,
                            item: { ...pk, status },
                            patch: { status },
                            selector: { user: ['id', 'name'] },
                        });

                        if (status === 'approved') {
                            await this.chatService.addToRoom(ctx, { roomId: rideId, userId: user.id });
                        }

                        this.notificationService.sendMessagesByUserSilent({
                            userId: ride.organizerId,
                            notification: {
                                title: `${user.name} has joined the ride`,
                                // TODO: I would like to add ride.startName, ride.startDate to the first line of the body
                                body: `➕ It's almost a peloton! Invite someone else.`,
                                action: navigationAction('user', user.id),
                            },
                        });

                        return;
                    }
                    break;
                }
                case 'leave': {
                    if (status === 'approved' || status === 'pending') {
                        const { user } = await Users2Ride.update(ctx.t, {
                            pk,
                            patch: { status: 'left' },
                            selector: { user: ['id', 'name'] },
                        });

                        await this.chatService.kickFromRoom(ctx, { roomId: rideId, userId: user.id });

                        this.notificationService.sendMessagesByUserSilent({
                            userId: ride.organizerId,
                            notification: {
                                title: `${user.name} has left the ride`,
                                body: `🙄 Not a problem. You can invite someone else.`,
                                action: navigationAction('user', user.id),
                            },
                        });

                        return;
                    }
                    break;
                }
                default:
                    throw new UnreachableError(action);
            }

            throw new BadRequestError('Something went wrong');
        },
    });

    public setParticipantStatus = rpc({
        input: z.object({
            userId: z.string(),
            rideId: z.string(),
            status: z.union([z.literal('approved'), z.literal('declined')]),
        }),
        resolve: async ({ ctx, input: { status, rideId, userId } }) => {
            const ride = await Ride.findByPkOrError(ctx.t, {
                selector: ['status', 'privacy', 'organizerId', 'startName', 'startTimezoneId', 'startDate', 'title'],
                pk: { id: rideId },
            });

            if (!isRideEditable(ride)) {
                throw new BadRequestError(`The Ride has ${ride.status} status`);
            }

            checkPermission(ctx, ride.organizerId, 'You are not the organizer of the ride');

            const result = await Users2Ride.update(ctx.t, {
                pk: { rideId, userId },
                patch: { status },
                selector: {
                    status: true,
                    user: User.Selector,
                },
            });

            switch (status) {
                case 'approved':
                    await this.chatService.addToRoom(ctx, { roomId: rideId, userId });
                    break;
                case 'declined':
                    await this.chatService.kickFromRoom(ctx, { roomId: rideId, userId });
                    break;
            }

            this.notificationService.sendMessagesByUserSilent({
                userId,
                notification: {
                    title: getRidePushTitle(ride),
                    body: `The organizer of the ride has ${status} you`,
                    action: navigationAction('ride', rideId),
                },
            });

            return result;
        },
    });

    public ['ride_ops/invite'] = rpc({
        input: z.object({ rideId: z.string(), userId: z.string() }),
        resolve: async ({ ctx, input }) => {
            const ride = await Ride.findByPkOrError(ctx.t, {
                selector: ['status', 'privacy', 'organizerId', 'startName', 'startTimezoneId', 'startDate', 'title'],
                pk: { id: input.rideId },
            });

            if (ride.organizerId === input.userId) {
                throw new BadRequestError('The User is the organizer of the ride');
            }

            if (!isRideEditable(ride)) {
                throw new BadRequestError(`The Ride in the ${ride.status} status`);
            }

            const pk = { rideId: input.rideId, userId: input.userId };
            const status = await Users2Ride.findByPk(ctx.t, {
                pk,
                selector: { status: true },
            }).then((x) => x?.status);

            if (status) {
                throw new BadRequestError('The User knows about the Ride already');
            }

            const result = await Users2Ride.create(ctx.t, {
                item: { ...pk, status: 'invited' },
                selector: {
                    status: true,
                    user: User.Selector,
                },
            });

            this.notificationService.sendMessagesByUserSilent({
                userId: input.userId,
                notification: {
                    title: getRidePushTitle(ride),
                    body: `${ctx.user.name} has invited you to join a ride`,
                    action: navigationAction('ride', input.rideId),
                },
            });

            return result;
        },
    });

    public ['ride_ops/action'] = rpc({
        input: RideAction,
        resolve: async ({ ctx, input: { payload, type } }) => {
            switch (type) {
                case '@ride/START':
                    return this.operationsService.startRide(ctx, payload.rideId);
                case '@ride/FINISH':
                    return this.operationsService.finishRide(ctx, payload.rideId);
                case '@ride/CANCEL':
                    return this.operationsService.cancelRide(ctx, payload.rideId);
                default:
                    throw new BadRequestError('Unknown Action');
            }
        },
    });
}

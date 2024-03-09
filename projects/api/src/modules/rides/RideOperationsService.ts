import { InvalidOperationError } from '@untype/toolbox';
import { addMinutes } from 'date-fns';
import { singleton } from 'tsyringe';
import { Ride } from '../../entities';
import { schedule } from '../../worker';
import { navigationAction } from '../models/shared';
import { checkPermission } from '../models/utils';
import { getRidePushTitle } from '../push/utils';
import { Context } from '../rpc/models';

@singleton()
export class RideOperationsService {
    public startRide = async (ctx: Context, rideId: string) => {
        const pk = { id: rideId };
        const ride = await Ride.findByPkOrError(ctx.t, {
            pk,
            selector: ['status', 'organizerId', 'autoFinish', 'startName', 'startTimezoneId', 'startDate', 'title'],
        });

        if (ride.status !== 'created') {
            throw new InvalidOperationError('Unable to start the ride');
        }

        checkPermission(ctx, ride.organizerId, 'You are not an organizer of the ride');

        const { startedAt } = await Ride.update(ctx.t, {
            pk,
            patch: { status: 'started', startedAt: new Date() },
            selector: ['startedAt'],
        });

        if (ride.autoFinish && startedAt) {
            await schedule(
                ctx.t,
                { key: '@ride/FINISH', input: { rideId: rideId } },
                { runAt: addMinutes(startedAt, ride.autoFinish), jobKey: rideId },
            );
        }

        await schedule(ctx.t, {
            key: '@push/NOTIFY_ORGANIZER',
            input: {
                rideId,
                notification: {
                    title: getRidePushTitle(ride),
                    body: 'The ride has started',
                    action: navigationAction('ride', rideId),
                },
            },
        });
    };

    public finishRide = async (ctx: Context, rideId: string) => {
        const pk = { id: rideId };
        const ride = await Ride.findByPkOrError(ctx.t, {
            pk,
            selector: ['status', 'organizerId', 'startName', 'startTimezoneId', 'startDate', 'title'],
        });

        if (ride.status !== 'started') {
            throw new InvalidOperationError('Unable to finish the ride');
        }

        checkPermission(ctx, ride.organizerId, 'You are not an organizer of the ride');

        await Ride.update(ctx.t, {
            pk,
            patch: { status: 'finished', finishedAt: new Date() },
        });

        await schedule(ctx.t, {
            key: '@push/NOTIFY_ORGANIZER',
            input: {
                rideId,
                notification: {
                    title: getRidePushTitle(ride),
                    body: 'The ride has finished',
                    action: navigationAction('ride', rideId),
                },
            },
        });
    };

    public cancelRide = async (ctx: Context, rideId: string) => {
        const pk = { id: rideId };
        const ride = await Ride.findByPkOrError(ctx.t, {
            pk,
            selector: ['status', 'organizerId', 'startName', 'startTimezoneId', 'startDate', 'title'],
        });

        if (ride.status !== 'created' && ride.status !== 'started') {
            throw new InvalidOperationError('Unable to cancel the ride');
        }

        checkPermission(ctx, ride.organizerId, 'You are not an organizer of the ride');

        await Ride.update(ctx.t, {
            pk,
            patch: { status: 'canceled' },
        });

        await schedule(ctx.t, {
            key: '@push/NOTIFY_ORGANIZER',
            input: {
                rideId,
                notification: {
                    title: getRidePushTitle(ride),
                    body: 'The ride has been canceled',
                    action: navigationAction('ride', rideId),
                },
            },
        });
    };
}

import { task } from '@untype/worker';
import { singleton } from 'tsyringe';
import z from 'zod';
import { Ride } from '../../entities';
import { schedule } from '../../worker';
import { navigationAction } from '../models/shared';
import { adminContext } from '../models/utils';
import { getRidePushTitle } from '../push/utils';
import { RideOperationsService } from './RideOperationsService';

@singleton()
export class RideWorker {
    public constructor(private service: RideOperationsService) {}

    public ['@ride/START'] = task({
        input: z.object({ rideId: z.string() }),
        resolve: async ({ input, t }) => {
            const ride = await Ride.findByPkOrError(t, {
                pk: { id: input.rideId },
                selector: ['autoStart', 'status', 'startName', 'startTimezoneId', 'startDate', 'title'],
            });

            if (ride.autoStart && ride.status === 'created') {
                await schedule(t, {
                    key: '@push/NOTIFY_ORGANIZER',
                    input: {
                        rideId: input.rideId,
                        notification: {
                            title: getRidePushTitle(ride),
                            body: 'The ride has started',
                            action: navigationAction('ride', input.rideId),
                        },
                    },
                });

                await this.service.startRide(adminContext(t), input.rideId);
            }
        },
    });

    public ['@ride/FINISH'] = task({
        input: z.object({ rideId: z.string() }),
        resolve: async ({ input, t }) => {
            const ride = await Ride.findByPkOrError(t, {
                pk: { id: input.rideId },
                selector: ['autoFinish', 'startName', 'startTimezoneId', 'startDate', 'title'],
            });

            if (ride.autoFinish) {
                await schedule(t, {
                    key: '@push/NOTIFY_ORGANIZER',
                    input: {
                        rideId: input.rideId,
                        notification: {
                            title: getRidePushTitle(ride),
                            body: 'The ride has finished',
                            action: navigationAction('ride', input.rideId),
                        },
                    },
                });

                await this.service.finishRide(adminContext(t), input.rideId);
            }
        },
    });
}

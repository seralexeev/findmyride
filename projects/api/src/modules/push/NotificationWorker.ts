import { task } from '@untype/worker';
import { singleton } from 'tsyringe';
import z from 'zod';
import { Ride, Users2Ride } from '../../entities';
import { UnknownAction } from '../models/actions';
import { NotificationService } from './NotificationService';

@singleton()
export class NotificationWorker {
    public constructor(private service: NotificationService) {}

    public ['@push/NOTIFY_ORGANIZER'] = task({
        input: z.object({
            rideId: z.string(),
            notification: PushNotification,
        }),
        resolve: async ({ input, t }) => {
            const { organizerId } = await Ride.findByPkOrError(t, {
                pk: { id: input.rideId },
                selector: ['organizerId'],
            });

            await this.service.sendMessagesByUser({ userId: organizerId, notification: input.notification });
        },
    });

    public ['@push/NOTIFY_PARTICIPANTS'] = task({
        input: z.object({
            rideId: z.string(),
            notification: PushNotification,
        }),
        resolve: async ({ input, t }) => {
            const users = await Users2Ride.find(t, {
                filter: {
                    rideId: { equalTo: input.rideId },
                    status: { equalTo: 'approved' },
                },
                selector: ['userId'],
            });

            for (const { userId } of users) {
                await this.service.sendMessagesByUser({ userId, notification: input.notification });
            }
        },
    });

    public ['@push/RIDE_NEARBY'] = task({
        input: z.object({
            rideId: z.string(),
            notification: PushNotification,
        }),
        resolve: async ({ input, t }) => {
            const users = await t.sql<{ userId: string }>`
                SELECT DISTINCT(d.user_id) AS "userId"
                FROM user_sessions AS d
                JOIN rides AS r ON ST_DWithin (r.start_location, get_user_location(d.user_id, d.id), 5000)
                WHERE r.id = ${input.rideId} AND d.user_id != r.organizer_id
            `;

            for (const { userId } of users) {
                await this.service.sendMessagesByUser({ userId, notification: input.notification });
            }
        },
    });

    public ['@push/FOLLOWING_RIDE'] = task({
        input: z.object({
            rideId: z.string(),
            notification: PushNotification,
        }),
        resolve: async ({ input, t }) => {
            const users = await t.sql<{ userId: string }>`
                SELECT DISTINCT (f.user_id) AS "userId"
                FROM follows AS f
                JOIN rides AS r ON f.following_id = r.organizer_id
                WHERE r.id = ${input.rideId}
            `;

            for (const { userId } of users) {
                await this.service.sendMessagesByUser({ userId, notification: input.notification });
            }
        },
    });
}

export type PushNotification = z.infer<typeof PushNotification>;
const PushNotification = z.object({
    title: z.string(),
    body: z.string().optional(),
    action: z.union([UnknownAction, z.array(UnknownAction)]).optional(),
});

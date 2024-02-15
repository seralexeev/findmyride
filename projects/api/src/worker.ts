import { createWorker } from '@untype/worker';
import { NotificationWorker } from './modules/push/NotificationWorker';
import { RideWorker } from './modules/rides/RideWorker';

export const { schedule, startWorker } = createWorker(() => ({
    NotificationWorker,
    RideWorker,
}));

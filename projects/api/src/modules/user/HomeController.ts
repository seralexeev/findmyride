import { singleton } from 'tsyringe';
import { ChatService } from '../chat/ChatService';
import { RideService } from '../rides/RideService';
import { rpc } from '../rpc';

@singleton()
export class HomeController {
    public constructor(
        private rideService: RideService,
        private chatService: ChatService,
    ) {}

    public ['home/data'] = rpc({
        resolve: async ({ ctx }) => {
            const [activeRides, unreadMessages] = await Promise.all([
                this.rideService.getActiveRidesCount(ctx),
                this.chatService.getUnreadMessagesCount(ctx),
            ]);

            return {
                activeRides,
                unreadMessages,
            };
        },
    });
}

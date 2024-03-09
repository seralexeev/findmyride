import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { ChatService } from '../chat/ChatService';
import { RideService } from '../rides/RideService';
import { rpc } from '../rpc';

@singleton()
export class HomeController {
    public constructor(
        private rideService: RideService,
        private chatService: ChatService,
        private config: Config,
    ) {}

    public ['home/config'] = rpc({
        anonymous: true,
        resolve: async () => {
            return {
                mapbox: {
                    publicKey: this.config.mapbox.publicKey,
                },
                strava: {
                    clientId: this.config.strava.clientId,
                },
                links: {
                    privacyPolicy: '/privacy',
                    termsOfService: '/terms',
                },
                web: {
                    url: this.config.web.url,
                },
                auth: {
                    google: {
                        endpoint: 'https://accounts.google.com/o/oauth2/auth',
                        clientId: this.config.auth.google.clientId,
                    },
                },
            };
        },
    });

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

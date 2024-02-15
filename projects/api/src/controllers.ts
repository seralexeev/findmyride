import { AuthController } from './modules/auth/AuthController';
import { ChatController } from './modules/chat/ChatController';
import { FileController } from './modules/files/FileController';
import { GeoController } from './modules/geo/GeoController';
import { IntegrationController } from './modules/geo/IntegrationController';
import { RideImageController } from './modules/rides/RideImageController';
import { RidesController } from './modules/rides/RidesController';
import { RidesOperationsController } from './modules/rides/RidesOperationsController';
import { HomeController } from './modules/user/HomeController';
import { SocialController } from './modules/user/SocialController';
import { UserController } from './modules/user/UserController';

export const controllers = {
    AuthController,
    UserController,
    GeoController,
    IntegrationController,
    RidesController,
    FileController,
    RideImageController,
    RidesOperationsController,
    SocialController,
    ChatController,
    HomeController,
};

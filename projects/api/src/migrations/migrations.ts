/* prettier-ignore */
/**
 * This file was auto-generated please do not modify it!
 */

import { MigrationList } from '@untype/migrations';

import init_1 from './001_init';
import add_files_2 from './002_add_files';
import add_users_3 from './003_add_users';
import add_sessions_4 from './004_add_sessions';
import add_rides_5 from './005_add_rides';
import add_ride_images_6 from './006_add_ride_images';
import add_social_7 from './007_add_social';
import add_strava_8 from './008_add_strava';
import add_superuser_9 from './009_add_superuser';
import add_notification_status_10 from './010_add_notification_status';
import add_started_at_11 from './011_add_started_at';
import add_autostart_12 from './012_add_autostart';
import add_chat_link_13 from './013_add_chat_link';
import optional_finish_14 from './014_optional_finish';
import add_device_location_15 from './015_add_device_location';
import add_ride_title_16 from './016_add_ride_title';
import add_elevation_profile_17 from './017_add_elevation_profile';
import add_chat_18 from './018_add_chat';
import add_user_delete_19 from './019_add_user_delete';
import add_terms_20 from './020_add_terms';

export const migrations: MigrationList = [
    { id: 1, name: 'init', apply: init_1 },
    { id: 2, name: 'add_files', apply: add_files_2 },
    { id: 3, name: 'add_users', apply: add_users_3 },
    { id: 4, name: 'add_sessions', apply: add_sessions_4 },
    { id: 5, name: 'add_rides', apply: add_rides_5 },
    { id: 6, name: 'add_ride_images', apply: add_ride_images_6 },
    { id: 7, name: 'add_social', apply: add_social_7 },
    { id: 8, name: 'add_strava', apply: add_strava_8 },
    { id: 9, name: 'add_superuser', apply: add_superuser_9 },
    { id: 10, name: 'add_notification_status', apply: add_notification_status_10 },
    { id: 11, name: 'add_started_at', apply: add_started_at_11 },
    { id: 12, name: 'add_autostart', apply: add_autostart_12 },
    { id: 13, name: 'add_chat_link', apply: add_chat_link_13 },
    { id: 14, name: 'optional_finish', apply: optional_finish_14 },
    { id: 15, name: 'add_device_location', apply: add_device_location_15 },
    { id: 16, name: 'add_ride_title', apply: add_ride_title_16 },
    { id: 17, name: 'add_elevation_profile', apply: add_elevation_profile_17 },
    { id: 18, name: 'add_chat', apply: add_chat_18 },
    { id: 19, name: 'add_user_delete', apply: add_user_delete_19 },
    { id: 20, name: 'add_terms', apply: add_terms_20 },
];

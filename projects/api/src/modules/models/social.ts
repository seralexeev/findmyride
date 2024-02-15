export type SocialEvent =
    | { date: Date; type: 'follow'; userId: string }
    | { date: Date; type: 'ride_status'; rideId: string }
    | { date: Date; type: 'friend_ride'; rideId: string }
    | { date: Date; type: 'ride_nearby'; rideId: string }
    | { date: Date; type: 'ride_image'; imageId: string; userId: string };

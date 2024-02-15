export type StravaRoute = {
    athlete: {
        id: number;
        username: string | null;
        resource_state: 2;
        firstname: string;
        lastname: string;
        bio: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        sex: 'M';
        premium: true;
        summit: true;
        created_at: string;
        updated_at: string;
        badge_type_id: 1;
        weight: 0;
        profile_medium: string;
        profile: string;
        friend: null;
        follower: null;
    };
    description: string;
    distance: number;
    elevation_gain: number;
    id: number;
    id_str: string;
    map: {
        id: string;
        summary_polyline: string;
        resource_state: 2;
    };
    map_urls: {
        url: string;
        retina_url: string;
    };
    name: string;
    private: false;
    resource_state: 2;
    starred: true;
    sub_type: 2;
    created_at: string;
    updated_at: string;
    timestamp: number;
    type: 1;
    estimated_moving_time: number;
};

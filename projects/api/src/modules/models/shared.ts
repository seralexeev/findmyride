export const routes = {
    createRide: () => '/rides/new/source',
    userProfile: (id = ':id') => `/users/${id}`,
    ride: (id = ':id') => `/rides/${id}`,
    photos: (id = ':id') => `/photos/${id}`,
    chat: (id = ':id') => `/chat/${id}`,
    user: (id = ':id') => `/users/${id}`,
    home: () => '/home',
    feed: () => '/feed',
    profile: () => '/profile',
};

export type NavigationAction = {
    type: '@app/NAVIGATE';
    payload: {
        url: string;
    };
};

export const navigationAction = <T extends keyof typeof routes>(
    route: T,
    ...params: Required<Parameters<(typeof routes)[T]>>
): NavigationAction => {
    return {
        type: '@app/NAVIGATE',
        payload: { url: routes[route](...params) },
    };
};

export const Colors = {
    primary: '#FF6F5A',
};

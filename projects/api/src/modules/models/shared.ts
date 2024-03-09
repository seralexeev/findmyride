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
    black: '#0C0908',
};

export const formatSlug = (slug: string) => {
    return `@${slug}`;
};

const nFormatterLookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
].reverse();

const nFormatter = (num: number, { suffix = '', digits = 0, max = 6 }: { suffix?: string; digits?: number; max?: number }) => {
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;

    const item = nFormatterLookup.find((item, index) => num >= item.value && index >= max);

    const result = item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
    return suffix ? `${result}${suffix}` : result;
};

export const formatDistanceMeters = (distance: number) => {
    return nFormatter(distance, { suffix: 'm', max: 5 });
};

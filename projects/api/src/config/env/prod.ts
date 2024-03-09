import { define } from '../default';

export const prod = define({
    server: {
        port: 3000,
    },
    web: {
        url: 'https://findmyride.app',
    },
});

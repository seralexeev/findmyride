import ip from 'ip';
import { define } from '../default';

export const local = define({
    development: {
        useThrottle: 500,
    },
    logger: {
        pretty: 'yaml',
    },
    server: {
        port: 3000,
    },
    auth: {
        jwt: {
            secret: 'local',
        },
    },
    pg: {
        port: 5438,
    },
    storage: {
        endpoint: `http://${ip.address()}:9010`,
        credentials: {
            accessKeyId: 'ak_findmyride',
            secretAccessKey: 'findmyride',
        },
    },
    web: {
        url: `http://${ip.address()}.nip.io:3000`,
    },
});

import { ConfigShape } from '@untype/config';
import z from 'zod';

export const { shape, define } = new ConfigShape({
    env: z.enum(['prod', 'local']),
    server: {
        port: z.number().default(3000),
        includeErrorsResponse: z.boolean().default(false),
    },
    development: {
        useThrottle: z.number().default(0),
    },
    logger: {
        pretty: z.enum(['none', 'json', 'yaml']).default('none'),
        level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    },
    auth: {
        jwt: {
            secret: z.string(),
            accessTokenExpiresIn: z.string().default('180d'),
            refreshTokenExpiresIn: z.string().default('365d'),
            issuer: z.string().default('Find My Ride'),
        },
    },
    pg: {
        user: z.string().default('findmyride'),
        password: z.string().default('findmyride'),
        database: z.string().default('findmyride'),
        host: z.string().default('localhost'),
        port: z.number().default(5432),
        ssl: z.boolean().default(false),
    },
    strava: {
        apiUrl: z.string().default('https://www.strava.com/api/v3'),
        clientId: z.string(),
        clientSecret: z.string(),
    },
    s3: {
        region: z.string().optional(),
        endpoint: z.string().optional(),
        forcePathStyle: z.boolean().optional(),
        credentials: {
            accessKeyId: z.string().default('findmyride'),
            secretAccessKey: z.string().default('findmyride'),
        },
    },
    worker: {
        enabled: z.boolean().default(true),
        concurrency: z.number().default(10),
    },
    mapbox: {
        token: z.string(),
    },
    google: {
        maps: {
            apiPath: z.string().default('https://maps.googleapis.com/maps/api'),
            apiKey: z.string(),
        },
    },
    firebase: {
        databaseURL: z.string().default('https://findmyride-b38a0.firebaseio.com'),
    },
});

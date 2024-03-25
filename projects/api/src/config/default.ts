import { ConfigShape } from '@untype/config';
import z from 'zod';

export const { shape, define } = new ConfigShape({
    env: z.enum(['prod', 'local']),
    server: {
        port: z.number(),
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
            tokenExpiresIn: z.string().default('180d'),
            slidingTokenWindow: z.string().default('7d'),
            issuer: z.string().default('findmyride.app'),
            audience: z.string().default('findmyride.app'),
        },
        google: {
            clientId: z.string().default('370136940957-bud960clekr6pgd5fadk3suqkls7a7f6.apps.googleusercontent.com'),
            clientSecret: z.string(),
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
    migrations: {
        enabled: z.boolean().default(true),
    },
    strava: {
        apiUrl: z.string().default('https://www.strava.com/api/v3'),
        clientId: z.string().default('121913'),
        clientSecret: z.string(),
    },
    storage: {
        bucket: z.string().default('findmyride'),
        endpoint: z.string(),
        forcePathStyle: z.boolean().default(true),
        region: z.string().default('us-east-1'),
        credentials: {
            accessKeyId: z.string(),
            secretAccessKey: z.string(),
        },
    },
    worker: {
        enabled: z.boolean().default(true),
        concurrency: z.number().default(10),
    },
    mapbox: {
        publicKey: z
            .string()
            .default('pk.eyJ1IjoiZmluZG15cmlkZWFwcCIsImEiOiJjbHN2M2drdnExN2czMmlwZ3YxOTMwamo5In0.Spo3ZVfITgaC-kjAa0F3Aw'),
    },
    firebase: {
        databaseURL: z.string().default('https://findmyride-b38a0.firebaseio.com'),
    },
    web: {
        url: z.string(),
    },
});

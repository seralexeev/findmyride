import { Point, Position } from '@untype/geo';
import { BadRequestError } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { rpc } from '../rpc';
import { GeoService } from './GeoService';
import { GpxService } from './GpxService';

@singleton()
export class GeoController {
    public constructor(
        private gpxService: GpxService,
        private geo: GeoService,
    ) {}

    public ['geo/upload_gpx'] = rpc({
        resolve: async ({ ctx, req }) => {
            if (!req.file) {
                throw new BadRequestError('File is required');
            }

            const { id } = await this.gpxService.processGpx(ctx, {
                buffer: req.file.buffer,
                meta: { originalName: req.file.originalname },
            });

            return this.gpxService.getGpxTrack(ctx, id);
        },
    });

    public ['geo/geocode'] = rpc({
        input: z.object({
            input: z.union([z.string(), Position]),
            types: z
                .union([
                    z.literal('country'),
                    z.literal('region'),
                    z.literal('postcode'),
                    z.literal('district'),
                    z.literal('place'),
                    z.literal('locality'),
                    z.literal('neighborhood'),
                    z.literal('address'),
                    z.literal('poi'),
                    z.literal('poi.landmark'),
                ])
                .array()
                .optional(),
        }),
        resolve: async ({ ctx, input }) => {
            return this.geo.geocode({
                query: input.input,
                types: input.types,
                proximity: ctx.user?.location.coordinates,
            });
        },
    });

    public ['geo/timezone'] = rpc({
        input: z.object({ coordinates: Position }),
        resolve: async ({ input }) => this.geo.getTimezone(input.coordinates),
    });

    public ['geo/distance'] = rpc({
        input: z.object({ from: Point, to: Point }),
        resolve: async ({ ctx, input }) => {
            const distance = await ctx.t.sql<{ distance: number }>`
                SELECT ST_Distance(ST_GeomFromGeoJSON(${input.from})::geography, ST_GeomFromGeoJSON(${input.to})::geography) as "distance"
            `.then((x) => x[0]?.distance ?? null);

            return { distance };
        },
    });

    public ['geo/distance_to_user'] = rpc({
        input: z.object({ target: Point }),
        resolve: async ({ ctx, input }) => {
            const distance = await ctx.t.sql<{ distance: number }>`
                SELECT ST_Distance(ST_GeomFromGeoJSON(${input.target})::geography, get_user_location(${ctx.user.id}, ${ctx.user.device.deviceId})) as "distance"
                FROM users AS u
                WHERE u.id = ${ctx.user.id}
            `.then((x) => x[0]?.distance ?? null);

            return { distance };
        },
    });
}

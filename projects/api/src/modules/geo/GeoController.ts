import { Point, Position } from '@untype/geo';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { FileService } from '../files/FileService';
import { rpc } from '../rpc';
import { GeoService } from './GeoService';
import { GpxService } from './GpxService';

@singleton()
export class GeoController {
    public constructor(
        private gpxService: GpxService,
        private geo: GeoService,
        private fileService: FileService,
    ) {}

    public ['geo/upload_gpx'] = rpc({
        input: z.object({ id: z.string() }),
        resolve: async ({ ctx, input }) => {
            const file = await this.fileService.getFile(ctx, input.id);
            const id = await this.gpxService.processGpx(ctx, file);

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
            // TODO: remove the cast
            const items = (await this.geo.geocode({
                query: input.input,
                types: input.types,
                // TODO: fixme
                // proximity: ctx.user?.location.coordinates,
            })) as Array<{
                id: string;
                name: string;
                fullAddress: string;
                bbox: number[] | undefined;
                center: Point;
            }>;

            return { items };
        },
    });

    public ['geo/timezone'] = rpc({
        anonymous: true,
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

    // TODOL: fixme
    public ['geo/distance_to_user'] = rpc({
        input: z.object({ target: Point }),
        resolve: async ({ ctx, input }) => {
            const distance = await ctx.t.sql<{ distance: number }>`
                SELECT ST_Distance(ST_GeomFromGeoJSON(${input.target})::geography, get_user_location(${ctx.user.id}, ${ctx.user.session.id})) as "distance"
                FROM users AS u
                WHERE u.id = ${ctx.user.id}
            `.then((x) => x[0]?.distance ?? null);

            return { distance };
        },
    });
}

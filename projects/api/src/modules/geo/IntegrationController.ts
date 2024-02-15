import { LineString, Point } from '@untype/geo';
import { Logger } from '@untype/logger';
import { BadRequestError } from '@untype/toolbox';
import Axios from 'axios';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { GpxTrack } from '../../entities';
import { FileService } from '../files/FileService';
import { rpc } from '../rpc';
import { GeoService } from './GeoService';
import { GpxService } from './GpxService';
import { StravaService } from './StravaService';
import { KomootParsedData } from './komoot';

const errorMessage = 'Unable to get the track. Please check its privacy settings. It should be Public.';

@singleton()
export class IntegrationController {
    private axios;
    public constructor(
        private logger: Logger,
        private fileService: FileService,
        private gpxService: GpxService,
        private geo: GeoService,
        private stravaService: StravaService,
    ) {
        this.axios = Axios.create({
            headers: {
                'user-agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
            },
        });
    }

    public ['rwg/parse'] = rpc({
        input: z.object({ url: z.string() }),
        resolve: async ({ ctx, input }) => {
            if (!input.url.match(/https:\/\/ridewithgps.com\/routes\/[0-9]+$/)) {
                throw new BadRequestError('Invalid url');
            }

            const resp = await this.axios
                .request<Buffer>({ url: `${input.url}.gpx?sub_format=route`, responseType: 'arraybuffer' })
                .catch(this.logger.error);

            if (!resp?.data) {
                throw new BadRequestError(errorMessage);
            }

            const { id } = await this.gpxService.processGpx(ctx, {
                buffer: resp.data,
                meta: { originalUrl: input.url },
            });

            return this.gpxService.getGpxTrack(ctx, id);
        },
    });

    public ['komoot/parse'] = rpc({
        input: z.object({ url: z.string() }),
        resolve: async ({ ctx, input }) => {
            const url = new URL(input.url);
            if (!url.host.includes('komoot')) {
                throw new BadRequestError('Invalid url');
            }

            const embedUrl = `https://${url.host}${url.pathname}/embed`;

            const page = await this.axios.request<string>({ url: embedUrl }).catch(this.logger.error);
            if (!page?.data) {
                throw new BadRequestError(errorMessage);
            }

            // TODO: it should be a gpx track
            const file = this.fileService.upload({ url: embedUrl });

            const json = page.data.match(/kmtBoot.setProps\("(?<json>.+)"\);/)?.groups?.json;
            if (!json) {
                throw new BadRequestError(errorMessage);
            }

            const data: KomootParsedData = JSON.parse(json.replace(/\\"/g, '"').replace(/\\"/g, '"'));

            const { coordinates } = data.page._embedded.tour._embedded;

            const track: LineString = {
                type: 'LineString',
                coordinates: coordinates.items.map((x) => [x.lng, x.lat]),
            };

            const start = track.coordinates[0];
            const finish = track.coordinates[track.coordinates.length - 1];

            if (!start || !finish) {
                throw new BadRequestError('Unable to process the track');
            }

            const [startName, finishName] = await Promise.all([
                this.geo.reverseGeocodeShortPlaceName(start),
                this.geo.reverseGeocodeShortPlaceName(finish),
            ]);

            const { tour } = data.page._embedded;

            const startLocation: Point = {
                type: 'Point',
                coordinates: start,
            };

            const finishLocation: Point = {
                type: 'Point',
                coordinates: finish,
            };

            const { id } = await GpxTrack.create(ctx.t, {
                item: {
                    // TODO: generate gpx file here
                    fileId: await file.then((x) => x.file.id),
                    userId: ctx.user.id,
                    elevation: tour.elevation_up,
                    startName,
                    finishName,
                    track: track,
                    startLocation: startLocation,
                    finishLocation: finishLocation,
                },
                selector: ['id'],
            });

            return {
                ...(await this.gpxService.getGpxTrack(ctx, id)),
                manualDistance: tour.distance,
            };
        },
    });

    public ['strava/get_routes'] = rpc({
        resolve: async ({ ctx }) => {
            return {
                items: await this.stravaService.getRoutes(ctx),
            };
        },
    });

    public ['strava/import_gpx'] = rpc({
        input: z.object({ routeId: z.string() }),
        resolve: async ({ ctx, input }) => {
            return this.stravaService.importStravaGpx(ctx, input.routeId);
        },
    });
}

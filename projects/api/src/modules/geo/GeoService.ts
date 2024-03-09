import MapboxGeocoder, { GeocodeFeature, GeocodeRequest } from '@mapbox/mapbox-sdk/services/geocoding';
import MapboxStatic, {
    CustomMarkerOverlay,
    GeoJsonOverlay,
    PathOverlay,
    SimpleMarkerOverlay,
} from '@mapbox/mapbox-sdk/services/static';
import { LineString, Position, geo } from '@untype/geo';
import { array, assert } from '@untype/toolbox';
import Axios from 'axios';
import { singleton } from 'tsyringe';
import z from 'zod';
import { Config } from '../../config';
import { FileService } from '../files/FileService';
import { Context } from '../rpc/models';

@singleton()
export class GeoService {
    private geocoder;
    private static;
    private elevationChart;
    private elevation;
    private timezone;

    public constructor(
        config: Config,
        private fileService: FileService,
    ) {
        this.geocoder = MapboxGeocoder({ accessToken: config.mapbox.publicKey });
        this.static = MapboxStatic({ accessToken: config.mapbox.publicKey });

        this.elevation = Axios.create({
            baseURL: 'https://api.elevationapi.com/api',
        });

        this.elevationChart = Axios.create({
            baseURL: 'https://quickchart.io/chart/render/zm-9d9aea9d-03bd-45a1-89cc-2a751bf78bd9',
        });

        this.timezone = Axios.create({
            baseURL: 'https://api.geotimezone.com/public',
        });
    }

    public geocode = async (query: GeocodeRequest) => {
        const forward = typeof query.query === 'string';
        query.language ??= ['en'];

        const request = forward ? this.geocoder.forwardGeocode(query) : this.geocoder.reverseGeocode(query);
        const res = await request.send().then((x) => x.body);

        return res.features.filter(assert.exists).map((x) => ({
            id: x.id,
            name: x.context ? this.getShortName(x) : x.text,
            fullAddress: x.place_name,
            bbox: x.bbox,
            center: geo.positionToPoint(x.center as Position),
        }));
    };

    private getShortName = (feature: GeocodeFeature) => {
        const map = array.reduceBy(
            feature.context,
            (x) => x.id.split('.')[0]!,
            (x) => x.text,
        );

        return [map['locality'] ?? map['place'], map['country'] ?? map['region'] ?? map['postcode'] ?? map['district']]
            .filter(Boolean)
            .join(', ');
    };

    public getTimezone = async ([longitude, latitude]: Position) => {
        const { iana_timezone, timezone_abbreviation } = await this.timezone
            .get('/timezone', { params: { latitude, longitude } })
            .then((x) => TimezoneResponse.parse(x.data));

        return { timeZoneId: iana_timezone, timeZoneName: timezone_abbreviation };
    };

    public reverseGeocodeShortPlaceName = async (query: Position) => {
        const [res] = await this.geocode({ query });

        return (res?.name as string | undefined) ?? 'Unknown';
    };

    private getStaticMapUrl = (
        overlays: Array<CustomMarkerOverlay | SimpleMarkerOverlay | PathOverlay | GeoJsonOverlay>,
        options?: { zoom: number; center: Position },
    ) => {
        return this.static
            .getStaticImage({
                logo: false,
                attribution: false,
                styleId: 'light-v10',
                width: 1280,
                height: 640,
                position: options ? { coordinates: options.center, zoom: options.zoom } : 'auto',
                overlays,
                padding: options ? undefined : '32,32,32,32',
                ownerId: 'mapbox',
                highRes: true,
            })
            .url();
    };

    public getStaticMapFile = (
        ctx: Context<false>,
        overlays: Array<CustomMarkerOverlay | SimpleMarkerOverlay | PathOverlay | GeoJsonOverlay>,
        options?: { zoom: number; center: Position },
    ) => {
        return this.fileService.upload(ctx, 'images', {
            url: this.getStaticMapUrl(overlays, options),
        });
    };

    public getElevationProfileId = async (ctx: Context, line: LineString) => {
        const res = await this.elevation
            .request({
                method: 'POST',
                url: '/Elevation/line',
                data: { line, dataSetName: 'SRTM_GL3', reduceResolution: 1 },
            })
            .then((x) => ElevationsResponse.parse(x.data));

        const labels: number[] = [];
        const data1: number[] = [];

        for (const { elevation, distanceFromOriginMeters } of res?.geoPoints ?? []) {
            labels.push(Math.round(distanceFromOriginMeters / 1000));
            data1.push(Math.round(elevation));
        }

        const { data: buffer } = await this.elevationChart.request<Buffer>({
            method: 'POST',
            responseType: 'arraybuffer',
            params: {
                labels: labels.join(','),
                data1: data1.join(','),
                format: 'png',
            },
        });

        const { file } = await this.fileService.upload(ctx, 'images', {
            buffer,
            mimeType: 'image/png',
        });

        return file;
    };
}

const TimezoneResponse = z.object({
    iana_timezone: z.string(),
    timezone_abbreviation: z.string().optional().default(''),
});

const ElevationsResponse = z.object({
    geoPoints: z
        .array(
            z.object({
                elevation: z.number(),
                distanceFromOriginMeters: z.number(),
            }),
        )
        .optional(),
});

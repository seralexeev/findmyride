import { Client, Status } from '@googlemaps/google-maps-services-js';
import MapboxGeocoder, { GeocodeFeature, GeocodeRequest } from '@mapbox/mapbox-sdk/services/geocoding';
import MapboxStatic, {
    CustomMarkerOverlay,
    GeoJsonOverlay,
    PathOverlay,
    SimpleMarkerOverlay,
} from '@mapbox/mapbox-sdk/services/static';
import { LineString, Position, geo } from '@untype/geo';
import { InternalError, array, assert } from '@untype/toolbox';
import Axios from 'axios';
import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { FileService } from '../files/FileService';

@singleton()
export class GeoService {
    private geocoder;
    private static;
    private google;
    private elevationChart;
    private elevation;

    public constructor(
        private config: Config,
        private fileService: FileService,
    ) {
        this.geocoder = MapboxGeocoder({ accessToken: config.mapbox.token });
        this.static = MapboxStatic({ accessToken: config.mapbox.token });
        this.google = new Client({ config: { baseURL: config.google.maps.apiPath } });

        this.config = config;
        this.elevation = Axios.create({
            baseURL: 'https://api.elevationapi.com/api',
        });

        this.elevationChart = Axios.create({
            baseURL: 'https://quickchart.io/chart/render/zm-9d9aea9d-03bd-45a1-89cc-2a751bf78bd9',
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

    public getTimezone = async ([lng, lat]: Position) => {
        const result = await this.google.timezone({
            params: {
                key: this.config.google.maps.apiKey,
                location: { lng, lat },
                timestamp: Math.floor(new Date().getTime() / 1000),
            },
        });

        if (result.data.status !== Status.OK) {
            throw new InternalError('Unable to get timezone', { cause: result });
        }

        return result.data;
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
        overlays: Array<CustomMarkerOverlay | SimpleMarkerOverlay | PathOverlay | GeoJsonOverlay>,
        options?: { zoom: number; center: Position },
    ) => {
        return this.fileService.upload({
            url: this.getStaticMapUrl(overlays, options),
        });
    };

    public getElevationProfileId = async (line: LineString) => {
        const res = await this.elevation
            .request<any>({
                method: 'POST',
                url: '/Elevation/line',
                data: { line, dataSetName: 'SRTM_GL3', reduceResolution: 1 },
            })
            .then((x) => x.data);

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

        const { file } = await this.fileService.upload({
            buffer,
            mimeType: 'image/png',
        });

        return file;
    };
}

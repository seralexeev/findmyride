import { FeatureCollection, LineString, geo } from '@untype/geo';
import { BadRequestError, object } from '@untype/toolbox';
import { DOMParser } from '@xmldom/xmldom';
import togeojson from 'togeojson';
import { singleton } from 'tsyringe';
import { GeoJsonSelector, GpxTrack } from '../../entities';
import { Context } from '../rpc/models';
import { GeoService } from './GeoService';

@singleton()
export class GpxService {
    public constructor(private geo: GeoService) {}

    public processGpx = async (ctx: Context, { buffer, file }: { file: { id: string }; buffer: Buffer }) => {
        const gpx = await this.processGpxFromBuffer(buffer);

        return GpxTrack.create(ctx.t, {
            item: {
                fileId: file.id,
                userId: ctx.user.id,
                elevation: gpx.elevation,
                startLocation: gpx.start.location,
                startName: gpx.start.name,
                finishLocation: gpx.finish.location,
                finishName: gpx.finish.name,
                track: gpx.track,
            },
            selector: ['id'],
        }).then((x) => x.id);
    };

    private processGpxFromBuffer = async (file: Buffer) => {
        const xml = new DOMParser().parseFromString(file.toString());
        const geojson = togeojson.gpx(xml) as FeatureCollection<LineString>;
        const track = geojson.features[0]?.geometry;
        if (!track) {
            throw new BadRequestError('Unable to parse gpx');
        }

        for (let i = 0; i < track.coordinates.length; i++) {
            const point = track.coordinates[i];
            if (point) {
                track.coordinates[i] = [point[0], point[1]];
            }
        }

        const start = track.coordinates[0];
        if (!start) {
            throw new BadRequestError('Unable to get start point');
        }

        const finish = track.coordinates[track.coordinates.length - 1];
        if (!finish) {
            throw new BadRequestError('Unable to get start point');
        }

        const [startName, finishName] = await Promise.all([
            this.geo.reverseGeocodeShortPlaceName(start),
            this.geo.reverseGeocodeShortPlaceName(finish),
        ]);

        return {
            track,
            start: {
                location: geo.positionToPoint(start),
                name: startName,
            },
            finish: {
                location: geo.positionToPoint(finish),
                name: finishName,
            },
            elevation: null,
        };
    };

    public getGpxTrack = async (ctx: Context, id: string) => {
        const track = await GpxTrack.findByPkOrError(ctx.t, {
            pk: { id },
            selector: {
                id: true,
                elevation: true,
                track: GeoJsonSelector,
                startLocation: GeoJsonSelector,
                finishLocation: GeoJsonSelector,
                calculatedDistance: true,
                startName: true,
                finishName: true,
                bbox: true,
                file: ['url'],
            },
        });

        const [distanceToStart, timeZone] = await Promise.all([
            ctx.t.sql<{ distanceToStart: number | null }>`
                SELECT ST_Distance(g.start_location, get_user_location(${ctx.user.id}, ${ctx.user.session.id})) as "distanceToStart"
                FROM gpx_tracks AS g
                JOIN users AS u ON u.id = ${ctx.user.id} AND g.id = ${id}
            `.then((x) => x[0]?.distanceToStart ?? null),
            this.geo.getTimezone(track.startLocation.geojson.coordinates),
        ]);

        return {
            ...object.pick(track, ['id', 'elevation', 'bbox', 'calculatedDistance']),
            start: { name: track.startName, location: track.startLocation.geojson },
            finish: { name: track.finishName, location: track.finishLocation.geojson },
            track: track.track.geojson,
            gpxTrackUrl: track.file.url,
            distanceToStart,
            startTimezone: { id: timeZone.timeZoneId, name: timeZone.timeZoneName },
            manualDistance: null as number | null, // just for typings,
        };
    };
}

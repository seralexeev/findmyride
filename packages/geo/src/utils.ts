import * as turf from '@turf/turf';
import { assert } from '@untype/toolbox';
import { Point, Polygon, Position } from './geojson';

export const coordinatesToLatLng = (coordinates: Position) => {
    return {
        latitude: coordinates[1],
        longitude: coordinates[0],
    };
};

export const pointToLatLng = ({ coordinates }: Point) => {
    return coordinatesToLatLng(coordinates);
};

export const positionToPoint = (coordinates: Position): Point => {
    return { type: 'Point', coordinates };
};

export const getRandomPointInZone = (polygon: Polygon) => {
    const [{ geometry } = assert.never()] = turf.randomPoint(1, {
        bbox: turf.bbox(polygon),
    }).features;

    return geometry as Point;
};

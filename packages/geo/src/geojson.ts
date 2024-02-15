import z from 'zod';

/**
 * The valid values for the "type" property of GeoJSON geometry objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
export type GeoJsonGeometryTypes = Geometry['type'];

/**
 * The value values for the "type" property of GeoJSON Objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
export type GeoJsonTypes = GeoJSON['type'];

/**
 * Bounding box
 * https://tools.ietf.org/html/rfc7946#section-5
 */
export type BBox = [number, number, number, number];

/**
 * A Position is an array of coordinates.
 * https://tools.ietf.org/html/rfc7946#section-3.1.1
 * Array should contain between two and three elements.
 * The previous GeoJSON specification allowed more elements (e.g., which could be used to represent M values),
 * but the current specification only allows X, Y, and (optionally) Z to be defined.
 * [longitude, latitude, elevation]
 */
export type Position = [number, number];

/**
 * The base GeoJSON object.
 * https://tools.ietf.org/html/rfc7946#section-3
 * The GeoJSON specification also allows foreign members
 * (https://tools.ietf.org/html/rfc7946#section-6.1)
 * Developers should use "&" type in TypeScript or extend the interface
 * to add these foreign members.
 */
export interface GeoJsonObject {
    // Don't include foreign members directly into this type def.
    // in order to preserve type safety.
    // [key: string]: any;
    /**
     * Specifies the type of GeoJSON object.
     */
    type: GeoJsonTypes;
    /**
     * Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections.
     * The value of the bbox member is an array of length 2*n where n is the number of dimensions
     * represented in the contained geometries, with all axes of the most southwesterly point
     * followed by all axes of the more northeasterly point.
     * The axes order of a bbox follows the axes order of geometries.
     * https://tools.ietf.org/html/rfc7946#section-5
     */
    bbox?: BBox | undefined;
}

/**
 * Union of GeoJSON objects.
 */
export type GeoJSON = Geometry | Feature | FeatureCollection;

/**
 * Geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3
 */
export type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection;
export type GeometryObject = Geometry;

/**
 * Point geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.2
 */
export interface Point extends GeoJsonObject {
    type: 'Point';
    coordinates: Position;
}

/**
 * MultiPoint geometry object.
 *  https://tools.ietf.org/html/rfc7946#section-3.1.3
 */
export interface MultiPoint extends GeoJsonObject {
    type: 'MultiPoint';
    coordinates: Position[];
}

/**
 * LineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.4
 */
export interface LineString extends GeoJsonObject {
    type: 'LineString';
    coordinates: Position[];
}

/**
 * MultiLineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.5
 */
export interface MultiLineString extends GeoJsonObject {
    type: 'MultiLineString';
    coordinates: Position[][];
}

/**
 * Polygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.6
 */
export interface Polygon extends GeoJsonObject {
    type: 'Polygon';
    coordinates: Position[][];
}

/**
 * MultiPolygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.7
 */
export interface MultiPolygon extends GeoJsonObject {
    type: 'MultiPolygon';
    coordinates: Position[][][];
}

/**
 * Geometry Collection
 * https://tools.ietf.org/html/rfc7946#section-3.1.8
 */
export interface GeometryCollection extends GeoJsonObject {
    type: 'GeometryCollection';
    geometries: Geometry[];
}

export type GeoJsonProperties = { [name: string]: any } | null;

/**
 * A feature object which contains a geometry and associated properties.
 * https://tools.ietf.org/html/rfc7946#section-3.2
 */
export interface Feature<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends GeoJsonObject {
    type: 'Feature';
    /**
     * The feature's geometry
     */
    geometry: G;
    /**
     * A value that uniquely identifies this feature in a
     * https://tools.ietf.org/html/rfc7946#section-3.2.
     */
    id?: string | number | undefined;
    /**
     * Properties associated with this feature.
     */
    properties: P;
}

/**
 * A collection of feature objects.
 *  https://tools.ietf.org/html/rfc7946#section-3.3
 */
export interface FeatureCollection<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends GeoJsonObject {
    type: 'FeatureCollection';
    features: Array<Feature<G, P>>;
}

export const Position: z.ZodType<Position> = z.tuple([z.number(), z.number()]);

export const BBox: z.ZodType<BBox> = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export const BoundingBoxSchema = z.object({ ne: Position, sw: Position });

export const Point: z.ZodType<Point> = z.object({
    type: z.literal('Point'),
    coordinates: Position,
    bbox: BBox.optional(),
});

export const MultiPoint: z.ZodType<MultiPoint> = z.object({
    type: z.literal('MultiPoint'),
    coordinates: z.array(Position),
    bbox: BBox.optional(),
});

export const LineString: z.ZodType<LineString> = z.object({
    type: z.literal('LineString'),
    coordinates: z.array(Position),
    bbox: BBox.optional(),
});

export const MultiLineString: z.ZodType<MultiLineString> = z.object({
    type: z.literal('MultiLineString'),
    coordinates: z.array(z.array(Position)),
    bbox: BBox.optional(),
});

export const Polygon: z.ZodType<Polygon> = z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(Position)),
    bbox: BBox.optional(),
});

export const MultiPolygon: z.ZodType<MultiPolygon> = z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(Position))),
    bbox: BBox.optional(),
});

export const Geometry: z.ZodType<Geometry> = z.lazy(() => {
    return z.union([Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollectionSchema]);
});

export const GeometryCollectionSchema: z.ZodType<GeometryCollection> = z.lazy(() => {
    return z.object({
        type: z.literal('GeometryCollection'),
        geometries: z.array(Geometry),
        bbox: BBox.optional(),
    });
});

export const GeoJsonPropertiesSchema: z.ZodType<GeoJsonProperties> = z.record(z.string(), z.any()).nullable();

export const FeatureSchema: z.ZodType<Feature> = z.object({
    type: z.literal('Feature'),
    geometry: Geometry,
    id: z.union([z.string(), z.number()]).optional(),
    properties: GeoJsonPropertiesSchema,
    bbox: BBox.optional(),
});

export const FeatureCollectionSchema: z.ZodType<FeatureCollection> = z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(FeatureSchema),
    bbox: BBox.optional(),
});

export const GeoJSONSchema: z.ZodType<GeoJSON> = z.union([Geometry, FeatureSchema, FeatureCollectionSchema]);

export type LatLng = {
    latitude: number;
    longitude: number;
};

export type LocationWithName = z.infer<typeof LocationWithName>;
export const LocationWithName = z.object({
    name: z.string(),
    location: Point,
});

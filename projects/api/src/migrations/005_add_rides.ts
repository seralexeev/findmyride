import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE OR REPLACE FUNCTION get_bbox(VARIADIC items geography[]) RETURNS jsonb AS $$
        BEGIN
            RETURN (
                SELECT
                    CASE
                        WHEN q.geojson_bbox ->> 'type' = 'Polygon' THEN json_build_object('ne', q.geojson_bbox -> 'coordinates' -> 0 -> 1, 'sw', q.geojson_bbox -> 'coordinates' -> 0 -> 3)::jsonb
                        -- WHEN q.geojson_bbox ->> 'type' = 'Point' THEN json_build_object('ne', q.geojson_bbox -> 'coordinates', 'sw', q.geojson_bbox -> 'coordinates')::jsonb
                        ELSE NULL::jsonb
                    END AS bbox
                FROM (
                    SELECT ST_Envelope(ST_Collect(items::geometry[]))::jsonb AS geojson_bbox
                ) AS q
            );
        END
        $$ LANGUAGE plpgsql IMMUTABLE
    `;

    await t.sql`
        CREATE OR REPLACE FUNCTION calculate_ride_distance(
            track geography(LineString),
            start_location geography(Point),
            finish_location geography(Point)
        )
        RETURNS double precision AS $$
        BEGIN
            IF track IS NOT NULL THEN
                RETURN ST_Length(track);
            ELSE 
                RETURN ST_distance(start_location, finish_location);
            END IF;
        END
        $$ LANGUAGE plpgsql IMMUTABLE
    `;

    await t.sql`
        CREATE TABLE IF NOT EXISTS gpx_tracks (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            user_id uuid NOT NULL REFERENCES users(id),
            file_id uuid NOT NULL REFERENCES files(id),
            track geography(LineString) NOT NULL,
            bbox jsonb GENERATED ALWAYS AS (get_bbox(track, start_location, finish_location)) STORED,
            start_location geography(Point) NOT NULL,
            start_name text NOT NULL,
            finish_location geography(Point) NOT NULL,
            finish_name text NOT NULL,
            elevation double precision,
            calculated_distance double precision GENERATED ALWAYS AS (calculate_ride_distance(track, start_location, finish_location)) STORED,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER gpx_tracks_updated_at BEFORE UPDATE ON gpx_tracks FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;

    await t.sql`
        CREATE TABLE IF NOT EXISTS rides (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            organizer_id uuid NOT NULL REFERENCES users(id),
            gpx_track_id uuid REFERENCES gpx_tracks(id),
            static_map_id uuid NOT NULL REFERENCES files(id),
            track geography(LineString),
            bbox jsonb GENERATED ALWAYS AS (get_bbox(track, start_location, finish_location)) STORED,
            status text NOT NULL,
            start_date timestamptz NOT NULL,
            bike_type text NOT NULL,
            rider_level text NOT NULL,
            ended_at timestamptz,
            track_source_url text,
            track_source text NOT NULL,
            start_location geography(Point) NOT NULL,
            start_name text NOT NULL,
            start_timezone_id text NOT NULL,
            start_timezone_name text NOT NULL,
            finish_location geography(Point) NOT NULL,
            finish_name text NOT NULL,
            elevation double precision,
            manual_distance double precision,
            calculated_distance double precision GENERATED ALWAYS AS (calculate_ride_distance(track, start_location, finish_location)) STORED,
            visibility text NOT NULL,
            privacy text NOT NULL,
            description text,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;

    await t.sql`
        CREATE TABLE IF NOT EXISTS users2rides (
            ride_id uuid NOT NULL REFERENCES rides(id),
            user_id uuid NOT NULL REFERENCES users(id),
            status text NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            PRIMARY KEY (ride_id, user_id)
        )
    `;

    await t.sql`CREATE TRIGGER users2rides_updated_at BEFORE UPDATE ON users2rides FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

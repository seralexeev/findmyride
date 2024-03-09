--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg110+2)
-- Dumped by pg_dump version 16.2 (Debian 16.2-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: findmyride
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO findmyride;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: findmyride
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO findmyride;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: findmyride
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO findmyride;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: findmyride
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pg_uuidv7; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_uuidv7 WITH SCHEMA public;


--
-- Name: EXTENSION pg_uuidv7; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_uuidv7 IS 'pg_uuidv7: create UUIDv7 values in postgres';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: tsm_system_rows; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tsm_system_rows WITH SCHEMA public;


--
-- Name: EXTENSION tsm_system_rows; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION tsm_system_rows IS 'TABLESAMPLE method which accepts number of rows as a limit';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: calculate_ride_distance(public.geography, public.geography, public.geography); Type: FUNCTION; Schema: public; Owner: findmyride
--

CREATE FUNCTION public.calculate_ride_distance(track public.geography, start_location public.geography, finish_location public.geography) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF track IS NOT NULL THEN
        RETURN ST_Length(track);
    ELSE 
        RETURN ST_distance(start_location, finish_location);
    END IF;
END
$$;


ALTER FUNCTION public.calculate_ride_distance(track public.geography, start_location public.geography, finish_location public.geography) OWNER TO findmyride;

--
-- Name: get_bbox(public.geography[]); Type: FUNCTION; Schema: public; Owner: findmyride
--

CREATE FUNCTION public.get_bbox(VARIADIC items public.geography[]) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.get_bbox(VARIADIC items public.geography[]) OWNER TO findmyride;

--
-- Name: get_user_location(uuid, text); Type: FUNCTION; Schema: public; Owner: findmyride
--

CREATE FUNCTION public.get_user_location(arg_user_id uuid, arg_device_id text) RETURNS public.geography
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN (
        SELECT CASE WHEN u.use_current_location THEN d.location ELSE u.location END
        FROM users AS u
        JOIN user_sessions AS d ON u.id = d.user_id
        WHERE u.id = arg_user_id AND d.id = arg_device_id::text
    );
END
$$;


ALTER FUNCTION public.get_user_location(arg_user_id uuid, arg_device_id text) OWNER TO findmyride;

--
-- Name: immutable_concat_ws(text, text[]); Type: FUNCTION; Schema: public; Owner: findmyride
--

CREATE FUNCTION public.immutable_concat_ws(text, VARIADIC text[]) RETURNS text
    LANGUAGE internal IMMUTABLE PARALLEL SAFE
    AS $$text_concat_ws$$;


ALTER FUNCTION public.immutable_concat_ws(text, VARIADIC text[]) OWNER TO findmyride;

--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: public; Owner: findmyride
--

CREATE FUNCTION public.trigger_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = clock_timestamp();
        RETURN NEW;
    END;
$$;


ALTER FUNCTION public.trigger_set_updated_at() OWNER TO findmyride;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    ride_id uuid,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    last_message_id uuid
);


ALTER TABLE public.chat_rooms OWNER TO findmyride;

--
-- Name: files; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.files (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    mime_type text NOT NULL,
    size integer,
    bucket text NOT NULL,
    key text NOT NULL,
    url text NOT NULL,
    width integer,
    height integer,
    blurhash text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.files OWNER TO findmyride;

--
-- Name: follows; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.follows (
    user_id uuid NOT NULL,
    following_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.follows OWNER TO findmyride;

--
-- Name: gpx_tracks; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.gpx_tracks (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid NOT NULL,
    file_id uuid NOT NULL,
    track public.geography(LineString,4326) NOT NULL,
    bbox jsonb GENERATED ALWAYS AS (public.get_bbox(VARIADIC ARRAY[track, start_location, finish_location])) STORED,
    start_location public.geography(Point,4326) NOT NULL,
    start_name text NOT NULL,
    finish_location public.geography(Point,4326) NOT NULL,
    finish_name text NOT NULL,
    elevation double precision,
    calculated_distance double precision GENERATED ALWAYS AS (public.calculate_ride_distance(track, start_location, finish_location)) STORED,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.gpx_tracks OWNER TO findmyride;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    text text,
    user_id uuid NOT NULL,
    room_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.messages OWNER TO findmyride;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.migrations OWNER TO findmyride;

--
-- Name: ride_images; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.ride_images (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    file_id uuid NOT NULL,
    user_id uuid NOT NULL,
    ride_id uuid NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.ride_images OWNER TO findmyride;

--
-- Name: rides; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.rides (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    organizer_id uuid NOT NULL,
    gpx_track_id uuid,
    static_map_id uuid NOT NULL,
    track public.geography(LineString,4326),
    bbox jsonb GENERATED ALWAYS AS (public.get_bbox(VARIADIC ARRAY[track, start_location, finish_location])) STORED,
    status text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    bike_type text NOT NULL,
    rider_level text NOT NULL,
    ended_at timestamp with time zone,
    track_source_url text,
    track_source text NOT NULL,
    start_location public.geography(Point,4326) NOT NULL,
    start_name text NOT NULL,
    start_timezone_id text NOT NULL,
    start_timezone_name text NOT NULL,
    finish_location public.geography(Point,4326),
    finish_name text,
    elevation double precision,
    manual_distance double precision,
    calculated_distance double precision GENERATED ALWAYS AS (public.calculate_ride_distance(track, start_location, finish_location)) STORED,
    visibility text NOT NULL,
    privacy text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    finished_at timestamp with time zone,
    started_at timestamp with time zone,
    auto_start boolean DEFAULT false NOT NULL,
    auto_finish integer,
    chat_link text,
    title text,
    elevation_profile_id uuid,
    terms_url text
);


ALTER TABLE public.rides OWNER TO findmyride;

--
-- Name: strava_accounts; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.strava_accounts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    athlete_id text NOT NULL,
    profile jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.strava_accounts OWNER TO findmyride;

--
-- Name: user2rooms; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.user2rooms (
    user_id uuid NOT NULL,
    room_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    last_seen_message_id uuid
);


ALTER TABLE public.user2rooms OWNER TO findmyride;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    user_id uuid NOT NULL,
    token_id uuid NOT NULL,
    fcm_token text,
    device_info jsonb,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    notification_status text,
    location public.geography(Point,4326),
    location_updated_at timestamp with time zone
);


ALTER TABLE public.user_sessions OWNER TO findmyride;

--
-- Name: users; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    slug public.citext NOT NULL,
    name text NOT NULL,
    avatar_id uuid,
    email public.citext NOT NULL,
    bio text,
    website public.citext,
    level text DEFAULT 'intermediate'::text NOT NULL,
    bike_type text[] DEFAULT ARRAY['road'::text] NOT NULL,
    location public.geography(Point,4326),
    location_name text,
    is_anonymous boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    strava_id uuid,
    use_current_location boolean DEFAULT true,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO findmyride;

--
-- Name: users2rides; Type: TABLE; Schema: public; Owner: findmyride
--

CREATE TABLE public.users2rides (
    ride_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL,
    updated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE public.users2rides OWNER TO findmyride;

--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (user_id, following_id);


--
-- Name: gpx_tracks gpx_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.gpx_tracks
    ADD CONSTRAINT gpx_tracks_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: ride_images ride_images_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.ride_images
    ADD CONSTRAINT ride_images_pkey PRIMARY KEY (id);


--
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (id);


--
-- Name: strava_accounts strava_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.strava_accounts
    ADD CONSTRAINT strava_accounts_pkey PRIMARY KEY (id);


--
-- Name: user2rooms user2rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user2rooms
    ADD CONSTRAINT user2rooms_pkey PRIMARY KEY (user_id, room_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_token_id_key; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_id_key UNIQUE (token_id);


--
-- Name: users2rides users2rides_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users2rides
    ADD CONSTRAINT users2rides_pkey PRIMARY KEY (ride_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_slug_key; Type: CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slug_key UNIQUE (slug);


--
-- Name: messages_room_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX messages_room_idx ON public.messages USING btree (room_id);


--
-- Name: messages_user_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX messages_user_idx ON public.messages USING btree (user_id);


--
-- Name: rides_title_trgm_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX rides_title_trgm_idx ON public.rides USING gin (title public.gin_trgm_ops);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_name_trgm_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX users_name_trgm_idx ON public.users USING gin (name public.gin_trgm_ops);


--
-- Name: users_slug_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX users_slug_idx ON public.users USING btree (slug);


--
-- Name: users_slug_trgm_idx; Type: INDEX; Schema: public; Owner: findmyride
--

CREATE INDEX users_slug_trgm_idx ON public.users USING gin (slug public.gin_trgm_ops);


--
-- Name: chat_rooms chat_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: files files_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: follows follows_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER follows_updated_at BEFORE UPDATE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: gpx_tracks gpx_tracks_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER gpx_tracks_updated_at BEFORE UPDATE ON public.gpx_tracks FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: messages messages_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: ride_images ride_images_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER ride_images_updated_at BEFORE UPDATE ON public.ride_images FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: rides rides_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: user_sessions set_timestamp; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: strava_accounts strava_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER strava_accounts_updated_at BEFORE UPDATE ON public.strava_accounts FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: user2rooms user2rooms_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER user2rooms_updated_at BEFORE UPDATE ON public.user2rooms FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: users2rides users2rides_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER users2rides_updated_at BEFORE UPDATE ON public.users2rides FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: users users_updated_at; Type: TRIGGER; Schema: public; Owner: findmyride
--

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: chat_rooms chat_rooms_last_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_last_message_id_fkey FOREIGN KEY (last_message_id) REFERENCES public.messages(id);


--
-- Name: chat_rooms chat_rooms_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id);


--
-- Name: follows follows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: gpx_tracks gpx_tracks_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.gpx_tracks
    ADD CONSTRAINT gpx_tracks_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: gpx_tracks gpx_tracks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.gpx_tracks
    ADD CONSTRAINT gpx_tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- Name: messages messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ride_images ride_images_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.ride_images
    ADD CONSTRAINT ride_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: ride_images ride_images_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.ride_images
    ADD CONSTRAINT ride_images_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: ride_images ride_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.ride_images
    ADD CONSTRAINT ride_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rides rides_elevation_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_elevation_profile_id_fkey FOREIGN KEY (elevation_profile_id) REFERENCES public.files(id);


--
-- Name: rides rides_gpx_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_gpx_track_id_fkey FOREIGN KEY (gpx_track_id) REFERENCES public.gpx_tracks(id);


--
-- Name: rides rides_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id);


--
-- Name: rides rides_static_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_static_map_id_fkey FOREIGN KEY (static_map_id) REFERENCES public.files(id);


--
-- Name: user2rooms user2rooms_last_seen_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user2rooms
    ADD CONSTRAINT user2rooms_last_seen_message_id_fkey FOREIGN KEY (last_seen_message_id) REFERENCES public.messages(id);


--
-- Name: user2rooms user2rooms_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user2rooms
    ADD CONSTRAINT user2rooms_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- Name: user2rooms user2rooms_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user2rooms
    ADD CONSTRAINT user2rooms_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users2rides users2rides_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users2rides
    ADD CONSTRAINT users2rides_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: users2rides users2rides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users2rides
    ADD CONSTRAINT users2rides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_avatar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);


--
-- Name: users users_strava_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: findmyride
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_strava_id_fkey FOREIGN KEY (strava_id) REFERENCES public.strava_accounts(id);


--
-- PostgreSQL database dump complete
--


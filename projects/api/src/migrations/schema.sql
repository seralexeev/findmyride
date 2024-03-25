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
-- Name: graphile_worker; Type: SCHEMA; Schema: -; Owner: findmyride
--

CREATE SCHEMA graphile_worker;


ALTER SCHEMA graphile_worker OWNER TO findmyride;

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
-- Name: job_spec; Type: TYPE; Schema: graphile_worker; Owner: findmyride
--

CREATE TYPE graphile_worker.job_spec AS (
	identifier text,
	payload json,
	queue_name text,
	run_at timestamp with time zone,
	max_attempts smallint,
	job_key text,
	priority smallint,
	flags text[]
);


ALTER TYPE graphile_worker.job_spec OWNER TO findmyride;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _private_jobs; Type: TABLE; Schema: graphile_worker; Owner: findmyride
--

CREATE TABLE graphile_worker._private_jobs (
    id bigint NOT NULL,
    job_queue_id integer,
    task_id integer NOT NULL,
    payload json DEFAULT '{}'::json NOT NULL,
    priority smallint DEFAULT 0 NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL,
    attempts smallint DEFAULT 0 NOT NULL,
    max_attempts smallint DEFAULT 25 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    key text,
    locked_at timestamp with time zone,
    locked_by text,
    revision integer DEFAULT 0 NOT NULL,
    flags jsonb,
    is_available boolean GENERATED ALWAYS AS (((locked_at IS NULL) AND (attempts < max_attempts))) STORED NOT NULL,
    CONSTRAINT jobs_key_check CHECK (((length(key) > 0) AND (length(key) <= 512))),
    CONSTRAINT jobs_max_attempts_check CHECK ((max_attempts >= 1))
);


ALTER TABLE graphile_worker._private_jobs OWNER TO findmyride;

--
-- Name: add_job(text, json, text, timestamp with time zone, integer, text, integer, text[], text); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.add_job(identifier text, payload json DEFAULT NULL::json, queue_name text DEFAULT NULL::text, run_at timestamp with time zone DEFAULT NULL::timestamp with time zone, max_attempts integer DEFAULT NULL::integer, job_key text DEFAULT NULL::text, priority integer DEFAULT NULL::integer, flags text[] DEFAULT NULL::text[], job_key_mode text DEFAULT 'replace'::text) RETURNS graphile_worker._private_jobs
    LANGUAGE plpgsql
    AS $$
declare
  v_job "graphile_worker"._private_jobs;
begin
  if (job_key is null or job_key_mode is null or job_key_mode in ('replace', 'preserve_run_at')) then
    select * into v_job
    from "graphile_worker".add_jobs(
      ARRAY[(
        identifier,
        payload,
        queue_name,
        run_at,
        max_attempts::smallint,
        job_key,
        priority::smallint,
        flags
      )::"graphile_worker".job_spec],
      (job_key_mode = 'preserve_run_at')
    )
    limit 1;
    return v_job;
  elsif job_key_mode = 'unsafe_dedupe' then
    -- Ensure all the tasks exist
    insert into "graphile_worker"._private_tasks as tasks (identifier)
    values (add_job.identifier)
    on conflict do nothing;
    -- Ensure all the queues exist
    if add_job.queue_name is not null then
      insert into "graphile_worker"._private_job_queues as job_queues (queue_name)
      values (add_job.queue_name)
      on conflict do nothing;
    end if;
    -- Insert job, but if one already exists then do nothing, even if the
    -- existing job has already started (and thus represents an out-of-date
    -- world state). This is dangerous because it means that whatever state
    -- change triggered this add_job may not be acted upon (since it happened
    -- after the existing job started executing, but no further job is being
    -- scheduled), but it is useful in very rare circumstances for
    -- de-duplication. If in doubt, DO NOT USE THIS.
    insert into "graphile_worker"._private_jobs as jobs (
      job_queue_id,
      task_id,
      payload,
      run_at,
      max_attempts,
      key,
      priority,
      flags
    )
      select
        job_queues.id,
        tasks.id,
        coalesce(add_job.payload, '{}'::json),
        coalesce(add_job.run_at, now()),
        coalesce(add_job.max_attempts::smallint, 25::smallint),
        add_job.job_key,
        coalesce(add_job.priority::smallint, 0::smallint),
        (
          select jsonb_object_agg(flag, true)
          from unnest(add_job.flags) as item(flag)
        )
      from "graphile_worker"._private_tasks as tasks
      left join "graphile_worker"._private_job_queues as job_queues
      on job_queues.queue_name = add_job.queue_name
      where tasks.identifier = add_job.identifier
    on conflict (key)
      -- Bump the updated_at so that there's something to return
      do update set
        revision = jobs.revision + 1,
        updated_at = now()
      returning *
      into v_job;
    if v_job.revision = 0 then
      perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":1}');
    end if;
    return v_job;
  else
    raise exception 'Invalid job_key_mode value, expected ''replace'', ''preserve_run_at'' or ''unsafe_dedupe''.' using errcode = 'GWBKM';
  end if;
end;
$$;


ALTER FUNCTION graphile_worker.add_job(identifier text, payload json, queue_name text, run_at timestamp with time zone, max_attempts integer, job_key text, priority integer, flags text[], job_key_mode text) OWNER TO findmyride;

--
-- Name: add_jobs(graphile_worker.job_spec[], boolean); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.add_jobs(specs graphile_worker.job_spec[], job_key_preserve_run_at boolean DEFAULT false) RETURNS SETOF graphile_worker._private_jobs
    LANGUAGE plpgsql
    AS $$
begin
  -- Ensure all the tasks exist
  insert into "graphile_worker"._private_tasks as tasks (identifier)
  select distinct spec.identifier
  from unnest(specs) spec
  on conflict do nothing;
  -- Ensure all the queues exist
  insert into "graphile_worker"._private_job_queues as job_queues (queue_name)
  select distinct spec.queue_name
  from unnest(specs) spec
  where spec.queue_name is not null
  on conflict do nothing;
  -- Ensure any locked jobs have their key cleared - in the case of locked
  -- existing job create a new job instead as it must have already started
  -- executing (i.e. it's world state is out of date, and the fact add_job
  -- has been called again implies there's new information that needs to be
  -- acted upon).
  update "graphile_worker"._private_jobs as jobs
  set
    key = null,
    attempts = jobs.max_attempts,
    updated_at = now()
  from unnest(specs) spec
  where spec.job_key is not null
  and jobs.key = spec.job_key
  and is_available is not true;

  -- WARNING: this count is not 100% accurate; 'on conflict' clause will cause it to be an overestimate
  perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":' || array_length(specs, 1)::text || '}');

  -- TODO: is there a risk that a conflict could occur depending on the
  -- isolation level?
  return query insert into "graphile_worker"._private_jobs as jobs (
    job_queue_id,
    task_id,
    payload,
    run_at,
    max_attempts,
    key,
    priority,
    flags
  )
    select
      job_queues.id,
      tasks.id,
      coalesce(spec.payload, '{}'::json),
      coalesce(spec.run_at, now()),
      coalesce(spec.max_attempts, 25),
      spec.job_key,
      coalesce(spec.priority, 0),
      (
        select jsonb_object_agg(flag, true)
        from unnest(spec.flags) as item(flag)
      )
    from unnest(specs) spec
    inner join "graphile_worker"._private_tasks as tasks
    on tasks.identifier = spec.identifier
    left join "graphile_worker"._private_job_queues as job_queues
    on job_queues.queue_name = spec.queue_name
  on conflict (key) do update set
    job_queue_id = excluded.job_queue_id,
    task_id = excluded.task_id,
    payload =
      case
      when json_typeof(jobs.payload) = 'array' and json_typeof(excluded.payload) = 'array' then
        (jobs.payload::jsonb || excluded.payload::jsonb)::json
      else
        excluded.payload
      end,
    max_attempts = excluded.max_attempts,
    run_at = (case
      when job_key_preserve_run_at is true and jobs.attempts = 0 then jobs.run_at
      else excluded.run_at
    end),
    priority = excluded.priority,
    revision = jobs.revision + 1,
    flags = excluded.flags,
    -- always reset error/retry state
    attempts = 0,
    last_error = null,
    updated_at = now()
  where jobs.locked_at is null
  returning *;
end;
$$;


ALTER FUNCTION graphile_worker.add_jobs(specs graphile_worker.job_spec[], job_key_preserve_run_at boolean) OWNER TO findmyride;

--
-- Name: complete_jobs(bigint[]); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.complete_jobs(job_ids bigint[]) RETURNS SETOF graphile_worker._private_jobs
    LANGUAGE sql
    AS $$
  delete from "graphile_worker"._private_jobs as jobs
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < now() - interval '4 hours'
    )
    returning *;
$$;


ALTER FUNCTION graphile_worker.complete_jobs(job_ids bigint[]) OWNER TO findmyride;

--
-- Name: force_unlock_workers(text[]); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.force_unlock_workers(worker_ids text[]) RETURNS void
    LANGUAGE sql
    AS $$
update "graphile_worker"._private_jobs as jobs
set locked_at = null, locked_by = null
where locked_by = any(worker_ids);
update "graphile_worker"._private_job_queues as job_queues
set locked_at = null, locked_by = null
where locked_by = any(worker_ids);
$$;


ALTER FUNCTION graphile_worker.force_unlock_workers(worker_ids text[]) OWNER TO findmyride;

--
-- Name: permanently_fail_jobs(bigint[], text); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.permanently_fail_jobs(job_ids bigint[], error_message text DEFAULT NULL::text) RETURNS SETOF graphile_worker._private_jobs
    LANGUAGE sql
    AS $$
  update "graphile_worker"._private_jobs as jobs
    set
      last_error = coalesce(error_message, 'Manually marked as failed'),
      attempts = max_attempts,
      updated_at = now()
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$;


ALTER FUNCTION graphile_worker.permanently_fail_jobs(job_ids bigint[], error_message text) OWNER TO findmyride;

--
-- Name: remove_job(text); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.remove_job(job_key text) RETURNS graphile_worker._private_jobs
    LANGUAGE plpgsql STRICT
    AS $$
declare
  v_job "graphile_worker"._private_jobs;
begin
  -- Delete job if not locked
  delete from "graphile_worker"._private_jobs as jobs
    where key = job_key
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
  returning * into v_job;
  if not (v_job is null) then
    perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":-1}');
    return v_job;
  end if;
  -- Otherwise prevent job from retrying, and clear the key
  update "graphile_worker"._private_jobs as jobs
  set
    key = null,
    attempts = jobs.max_attempts,
    updated_at = now()
  where key = job_key
  returning * into v_job;
  return v_job;
end;
$$;


ALTER FUNCTION graphile_worker.remove_job(job_key text) OWNER TO findmyride;

--
-- Name: reschedule_jobs(bigint[], timestamp with time zone, integer, integer, integer); Type: FUNCTION; Schema: graphile_worker; Owner: findmyride
--

CREATE FUNCTION graphile_worker.reschedule_jobs(job_ids bigint[], run_at timestamp with time zone DEFAULT NULL::timestamp with time zone, priority integer DEFAULT NULL::integer, attempts integer DEFAULT NULL::integer, max_attempts integer DEFAULT NULL::integer) RETURNS SETOF graphile_worker._private_jobs
    LANGUAGE sql
    AS $$
  update "graphile_worker"._private_jobs as jobs
    set
      run_at = coalesce(reschedule_jobs.run_at, jobs.run_at),
      priority = coalesce(reschedule_jobs.priority::smallint, jobs.priority),
      attempts = coalesce(reschedule_jobs.attempts::smallint, jobs.attempts),
      max_attempts = coalesce(reschedule_jobs.max_attempts::smallint, jobs.max_attempts),
      updated_at = now()
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$;


ALTER FUNCTION graphile_worker.reschedule_jobs(job_ids bigint[], run_at timestamp with time zone, priority integer, attempts integer, max_attempts integer) OWNER TO findmyride;

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

CREATE FUNCTION public.get_user_location(arg_user_id uuid, arg_session_id text) RETURNS public.geography
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN (
        SELECT CASE WHEN u.use_current_location THEN s.location ELSE u.location END
        FROM users AS u
        JOIN user_sessions AS s ON u.id = s.user_id
        WHERE u.id = arg_user_id AND s.id = arg_session_id::text
    );
END
$$;


ALTER FUNCTION public.get_user_location(arg_user_id uuid, arg_session_id text) OWNER TO findmyride;

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

--
-- Name: _private_job_queues; Type: TABLE; Schema: graphile_worker; Owner: findmyride
--

CREATE TABLE graphile_worker._private_job_queues (
    id integer NOT NULL,
    queue_name text NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    is_available boolean GENERATED ALWAYS AS ((locked_at IS NULL)) STORED NOT NULL,
    CONSTRAINT job_queues_queue_name_check CHECK ((length(queue_name) <= 128))
);


ALTER TABLE graphile_worker._private_job_queues OWNER TO findmyride;

--
-- Name: _private_known_crontabs; Type: TABLE; Schema: graphile_worker; Owner: findmyride
--

CREATE TABLE graphile_worker._private_known_crontabs (
    identifier text NOT NULL,
    known_since timestamp with time zone NOT NULL,
    last_execution timestamp with time zone
);


ALTER TABLE graphile_worker._private_known_crontabs OWNER TO findmyride;

--
-- Name: _private_tasks; Type: TABLE; Schema: graphile_worker; Owner: findmyride
--

CREATE TABLE graphile_worker._private_tasks (
    id integer NOT NULL,
    identifier text NOT NULL,
    CONSTRAINT tasks_identifier_check CHECK ((length(identifier) <= 128))
);


ALTER TABLE graphile_worker._private_tasks OWNER TO findmyride;

--
-- Name: job_queues_id_seq; Type: SEQUENCE; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_job_queues ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME graphile_worker.job_queues_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: jobs; Type: VIEW; Schema: graphile_worker; Owner: findmyride
--

CREATE VIEW graphile_worker.jobs AS
 SELECT jobs.id,
    job_queues.queue_name,
    tasks.identifier AS task_identifier,
    jobs.priority,
    jobs.run_at,
    jobs.attempts,
    jobs.max_attempts,
    jobs.last_error,
    jobs.created_at,
    jobs.updated_at,
    jobs.key,
    jobs.locked_at,
    jobs.locked_by,
    jobs.revision,
    jobs.flags
   FROM ((graphile_worker._private_jobs jobs
     JOIN graphile_worker._private_tasks tasks ON ((tasks.id = jobs.task_id)))
     LEFT JOIN graphile_worker._private_job_queues job_queues ON ((job_queues.id = jobs.job_queue_id)));


ALTER VIEW graphile_worker.jobs OWNER TO findmyride;

--
-- Name: jobs_id_seq1; Type: SEQUENCE; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME graphile_worker.jobs_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: graphile_worker; Owner: findmyride
--

CREATE TABLE graphile_worker.migrations (
    id integer NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    breaking boolean DEFAULT false NOT NULL
);


ALTER TABLE graphile_worker.migrations OWNER TO findmyride;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME graphile_worker.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
-- Name: _private_job_queues job_queues_pkey1; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_job_queues
    ADD CONSTRAINT job_queues_pkey1 PRIMARY KEY (id);


--
-- Name: _private_job_queues job_queues_queue_name_key; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_job_queues
    ADD CONSTRAINT job_queues_queue_name_key UNIQUE (queue_name);


--
-- Name: _private_jobs jobs_key_key1; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_jobs
    ADD CONSTRAINT jobs_key_key1 UNIQUE (key);


--
-- Name: _private_jobs jobs_pkey1; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_jobs
    ADD CONSTRAINT jobs_pkey1 PRIMARY KEY (id);


--
-- Name: _private_known_crontabs known_crontabs_pkey; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_known_crontabs
    ADD CONSTRAINT known_crontabs_pkey PRIMARY KEY (identifier);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: _private_tasks tasks_identifier_key; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_tasks
    ADD CONSTRAINT tasks_identifier_key UNIQUE (identifier);


--
-- Name: _private_tasks tasks_pkey; Type: CONSTRAINT; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE ONLY graphile_worker._private_tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


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
-- Name: jobs_main_index; Type: INDEX; Schema: graphile_worker; Owner: findmyride
--

CREATE INDEX jobs_main_index ON graphile_worker._private_jobs USING btree (priority, run_at) INCLUDE (id, task_id, job_queue_id) WHERE (is_available = true);


--
-- Name: jobs_no_queue_index; Type: INDEX; Schema: graphile_worker; Owner: findmyride
--

CREATE INDEX jobs_no_queue_index ON graphile_worker._private_jobs USING btree (priority, run_at) INCLUDE (id, task_id) WHERE ((is_available = true) AND (job_queue_id IS NULL));


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
-- Name: _private_job_queues; Type: ROW SECURITY; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_job_queues ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_jobs; Type: ROW SECURITY; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_known_crontabs; Type: ROW SECURITY; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_known_crontabs ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_tasks; Type: ROW SECURITY; Schema: graphile_worker; Owner: findmyride
--

ALTER TABLE graphile_worker._private_tasks ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


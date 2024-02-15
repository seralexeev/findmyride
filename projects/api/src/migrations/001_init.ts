import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await t.sql`CREATE EXTENSION IF NOT EXISTS "tsm_system_rows"`;
    await t.sql`CREATE EXTENSION IF NOT EXISTS "citext"`;
    await t.sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
    await t.sql`CREATE EXTENSION IF NOT EXISTS "pg_uuidv7"`;

    await t.sql`
        CREATE FUNCTION trigger_set_updated_at() RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                NEW.updated_at = clock_timestamp();
                RETURN NEW;
            END;
        $$;
    `;

    await t.sql`
        CREATE OR REPLACE FUNCTION immutable_concat_ws(text, VARIADIC text[])
        RETURNS text
        LANGUAGE internal IMMUTABLE PARALLEL SAFE AS 'text_concat_ws';
    `;
};

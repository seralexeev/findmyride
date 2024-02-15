import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS users (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            slug citext NOT NULL UNIQUE,
            name text NOT NULL, 
            avatar_id uuid REFERENCES files(id), 
            email citext NOT NULL UNIQUE, 
            bio text, 
            website citext, 
            level text NOT NULL DEFAULT 'intermediate', 
            bike_type text[] NOT NULL DEFAULT ARRAY['road'], 
            location geography(Point), 
            location_name text, 
            is_anonymous boolean NOT NULL DEFAULT false, 
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), 
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
    await t.sql`CREATE INDEX IF NOT EXISTS users_slug_idx ON users(slug)`;
    await t.sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`;
    await t.sql`CREATE INDEX IF NOT EXISTS users_slug_trgm_idx ON users USING GIN (slug gin_trgm_ops)`;
    await t.sql`CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING GIN (name gin_trgm_ops)`;
};

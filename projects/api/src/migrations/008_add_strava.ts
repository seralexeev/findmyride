import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS strava_accounts (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            access_token text NOT NULL,
            refresh_token text NOT NULL,
            athlete_id text NOT NULL,
            profile jsonb NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`ALTER TABLE users ADD column strava_id uuid REFERENCES strava_accounts(id)`;
    await t.sql`CREATE TRIGGER strava_accounts_updated_at BEFORE UPDATE ON strava_accounts FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

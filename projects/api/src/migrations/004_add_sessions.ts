import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id text NOT NULL PRIMARY KEY,
            user_id uuid NOT NULL REFERENCES users(id),
            token_id uuid NOT NULL UNIQUE,
            fcm_token text,
            device_info jsonb,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER set_timestamp BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

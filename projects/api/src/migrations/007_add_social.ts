import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS follows (
            user_id uuid NOT NULL REFERENCES users(id),
            following_id uuid NOT NULL REFERENCES users(id),
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            PRIMARY KEY (user_id, following_id)
        )
    `;

    await t.sql`CREATE TRIGGER follows_updated_at BEFORE UPDATE ON follows FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

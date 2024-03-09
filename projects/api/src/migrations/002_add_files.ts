import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS files (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            mime_type text NOT NULL,
            size int,
            bucket text NOT NULL,
            key text NOT NULL,
            url text NOT NULL,
            width int,
            height int,
            blurhash text,
            meta jsonb NOT NULL DEFAULT '{}',
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

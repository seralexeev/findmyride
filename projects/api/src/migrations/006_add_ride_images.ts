import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS ride_images (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            file_id uuid NOT NULL REFERENCES files(id),
            user_id uuid NOT NULL REFERENCES users(id),
            ride_id uuid NOT NULL REFERENCES rides(id),
            description text,
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
       )
    `;

    await t.sql`CREATE TRIGGER ride_images_updated_at BEFORE UPDATE ON ride_images FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};

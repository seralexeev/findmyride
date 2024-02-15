import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE user_devices ADD COLUMN location geography(Point)`;
    await t.sql`ALTER TABLE user_devices ADD COLUMN location_updated_at timestamptz`;
    await t.sql`ALTER TABLE users ADD COLUMN use_current_location boolean DEFAULT true`;
    await t.sql`
        CREATE OR REPLACE FUNCTION get_user_location(arg_user_id uuid, arg_device_id text) RETURNS geography(Point) AS $$
        BEGIN
            RETURN (
                SELECT CASE WHEN u.use_current_location THEN d.location ELSE u.location END
                FROM users AS u
                JOIN user_devices AS d ON u.id = d.user_id
                WHERE u.id = arg_user_id AND d.id = arg_device_id::text
            );
        END
        $$ LANGUAGE plpgsql IMMUTABLE;
    `;
};

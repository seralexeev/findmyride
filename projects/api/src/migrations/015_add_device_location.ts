import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE user_sessions ADD COLUMN location geography(Point)`;
    await t.sql`ALTER TABLE user_sessions ADD COLUMN location_updated_at timestamptz`;
    await t.sql`ALTER TABLE users ADD COLUMN use_current_location boolean DEFAULT true`;
    await t.sql`
        CREATE OR REPLACE FUNCTION get_user_location(arg_user_id uuid, arg_session_id text) RETURNS geography(Point) AS $$
        BEGIN
            RETURN (
                SELECT CASE WHEN u.use_current_location THEN s.location ELSE u.location END
                FROM users AS u
                JOIN user_sessions AS s ON u.id = s.user_id
                WHERE u.id = arg_user_id AND s.id = arg_session_id::text
            );
        END
        $$ LANGUAGE plpgsql IMMUTABLE;
    `;
};

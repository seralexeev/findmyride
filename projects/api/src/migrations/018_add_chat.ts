import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            ride_id uuid REFERENCES rides(id),
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;

    await t.sql`
        CREATE TABLE IF NOT EXISTS user2rooms (
            user_id uuid NOT NULL REFERENCES users(id),
            room_id uuid NOT NULL REFERENCES chat_rooms(id),
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            PRIMARY KEY (user_id, room_id)
        )
    `;

    await t.sql`CREATE TRIGGER user2rooms_updated_at BEFORE UPDATE ON user2rooms FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;

    await t.sql`
        CREATE TABLE IF NOT EXISTS messages (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
            text text,
            user_id uuid NOT NULL REFERENCES users(id),
            room_id uuid NOT NULL REFERENCES chat_rooms(id),
            updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
            created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )
    `;

    await t.sql`CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
    await t.sql`CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id)`;
    await t.sql`CREATE INDEX IF NOT EXISTS messages_room_idx ON messages(room_id)`;
    // check the index
    // await t.sql`CREATE INDEX IF NOT EXISTS messages_last_idx ON messages (room_id, updated_at DESC)`;

    await t.sql`ALTER TABLE chat_rooms ADD COLUMN last_message_id uuid REFERENCES messages(id)`;
    await t.sql`ALTER TABLE user2rooms ADD COLUMN last_seen_message_id uuid REFERENCES messages(id)`;
};

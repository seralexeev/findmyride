import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE user_sessions ADD COLUMN notification_status text`;
};

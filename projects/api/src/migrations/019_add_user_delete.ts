import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE users ADD COLUMN is_deleted boolean NOT NULL DEFAULT false`;
};

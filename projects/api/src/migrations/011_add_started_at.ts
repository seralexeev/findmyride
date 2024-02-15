import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE rides ADD COLUMN finished_at timestamptz`;
    await t.sql`ALTER TABLE rides ADD COLUMN started_at timestamptz`;
};

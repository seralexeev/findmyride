import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE rides ADD COLUMN auto_start boolean NOT NULL DEFAULT FALSE`;
    await t.sql`ALTER TABLE rides ADD COLUMN auto_finish int`;
};

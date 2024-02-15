import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE rides ALTER COLUMN finish_location DROP NOT NULL`;
    await t.sql`ALTER TABLE rides ALTER COLUMN finish_name DROP NOT NULL`;
};

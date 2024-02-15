import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE rides ADD COLUMN "terms_url" text`;
};

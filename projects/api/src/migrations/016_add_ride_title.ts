import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql`ALTER TABLE rides ADD COLUMN title text`;
    await t.sql`CREATE INDEX IF NOT EXISTS rides_title_trgm_idx ON rides USING GIN (title gin_trgm_ops)`;
};

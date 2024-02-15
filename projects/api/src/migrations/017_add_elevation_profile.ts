import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    t.sql`ALTER TABLE rides ADD COLUMN elevation_profile_id uuid REFERENCES files(id)`;
};

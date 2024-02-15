import { Transaction } from '@untype/pg';

export default async (t: Transaction) => {
    await t.sql<{ id: string }>`
        INSERT INTO "public"."users"
            ("id", "slug", "name", "email") 
        VALUES
            ('431fe9d7-35f3-48ca-a6fe-dc411afd6bf1', 'sam_barker', 'Sam Barker', 'findmyride.service@gmail.com')
    `;
};

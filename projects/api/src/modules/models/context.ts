import { Transaction } from '@untype/pg';

type User = { id: string };

export type Context<TAuth extends boolean = true> = {
    t: Transaction;
    user: TAuth extends true ? User : User | null;
};

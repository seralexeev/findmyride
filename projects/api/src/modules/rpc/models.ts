import { Transaction } from '@untype/pg';
import { Simplify } from '@untype/toolbox';

export type ApiUser = {
    id: string;
    name: string;
    isAnonymous: boolean;
    session: {
        id: string;
    };
};

export type Context<TAuth extends boolean = true> = Simplify<{
    t: Transaction;
    user: TAuth extends true ? ApiUser : ApiUser | null;
}>;

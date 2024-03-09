import { Transaction } from '@untype/pg';
import { InvalidOperationError } from '@untype/toolbox';
import { z } from 'zod';
import { Context } from '../rpc/models';

export const SAM_BARKER_ID = '431fe9d7-35f3-48ca-a6fe-dc411afd6bf1';

export const createPager = (page: number, pageSize: number) => {
    const limit = pageSize + 1;
    const slice = <T>(items: T[]) => {
        return {
            items: items.slice(0, pageSize),
            hasMore: items.length > pageSize,
        };
    };

    return { limit, offset: pageSize * (page - 1), slice };
};

export const DateSchema = z.union([z.date(), z.string()]);
export const PageSchema = z.number().int().positive().min(1);

export const checkPermission = (ctx: Context, expectedId: string, message: string) => {
    if (ctx.user.id === SAM_BARKER_ID) {
        return;
    }

    if (ctx.user.id !== expectedId) {
        throw new InvalidOperationError(message);
    }
};

export const adminContext = (t: Transaction): Context => {
    return {
        t,
        user: {
            id: SAM_BARKER_ID,
            session: {
                id: '00000000-0000-0000-0000-000000000000',
            },
            name: 'Sam Barker',
            isAnonymous: false,
        },
    };
};

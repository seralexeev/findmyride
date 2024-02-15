import { Transaction } from '@untype/pg';
import { InvalidOperationError } from 'packages/toolbox/src/error';
import { z } from 'zod';
import { Context } from './context';

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

const nFormatterLookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
].reverse();

const nFormatter = (num: number, { suffix = '', digits = 0, max = 6 }: { suffix?: string; digits?: number; max?: number }) => {
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;

    const item = nFormatterLookup.find((item, index) => num >= item.value && index >= max);

    const result = item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
    return suffix ? `${result}${suffix}` : result;
};

export const formatDistanceMeters = (distance: number) => {
    return nFormatter(distance, { suffix: 'm', max: 5 });
};

export const checkPermission = (ctx: Context, expectedId: string, message: string) => {
    if (ctx.user.id === SAM_BARKER_ID) {
        return;
    }

    if (ctx.user.id !== expectedId) {
        throw new InvalidOperationError(message);
    }
};

export const adminContext = (t: Transaction) => {
    return { t, user: { id: SAM_BARKER_ID } };
};

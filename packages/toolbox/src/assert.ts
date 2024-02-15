import { UnreachableError } from './error';
import { isPromise } from './promise';
import { Result, ResultError } from './result';

export function noexept<T>(fn: () => Promise<T>): Promise<Result<T>>;
export function noexept<T>(fn: () => T, defaultValue: T): T;
export function noexept<T>(fn: () => T): Result<T>;
export function noexept(fn: () => unknown, defaultValue?: unknown) {
    try {
        const result = fn();
        return isPromise(result) ? result.catch((cause) => defaultValue ?? ResultError(cause)) : result;
    } catch (cause) {
        return defaultValue ?? ResultError(cause);
    }
}

export function never<T>(check: never, defaultValue: T): T;
export function never(message?: string): never;
export function never(...args: unknown[]) {
    if (args.length > 1) {
        return args[1];
    }

    throw new UnreachableError(null as never, args[0] as string | undefined);
}

export const exists = <T>(obj?: T | undefined | null): obj is T => obj != null;
export const existsBy = <T>(key: keyof T) => {
    return (obj?: T | undefined | null): obj is T & { [K in keyof T]: Exclude<T[K], null | undefined> } => {
        return obj != null && obj[key] != null;
    };
};

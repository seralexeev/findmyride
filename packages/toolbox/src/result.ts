export type ResultError<T = unknown> = { __error: true; cause?: T };
export type Result<T, P = unknown> = T | ResultError<P>;
export type AsyncResult<T = unknown, P = unknown> = Promise<Result<T, P>>;

export const ResultError = <T = unknown>(cause: T): ResultError<T> => ({ __error: true, cause });

export const ifSuccess = <T, E, R>(map: (res: T) => R) => {
    return (res: Result<T, E>) => {
        if (isSuccess(res)) {
            return map(res);
        }

        return res;
    };
};

export const ifError = <T, P, R>(map: (res: ResultError<P>) => R) => {
    return (res: Result<T, P>) => {
        if (isError(res)) {
            return map(res);
        }

        return res;
    };
};

export const isError = <T, P>(result: Result<T, P>): result is ResultError<P> => {
    return typeof result === 'object' && result !== null && '__error' in result && result.__error === true;
};

export const isSuccess = <T, P>(result: Result<T, P>): result is T => !isError(result);

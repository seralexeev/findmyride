export const delay = (ms: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

export const settled = <T>(promise: PromiseSettledResult<T>): promise is PromiseFulfilledResult<T> => {
    return promise.status === 'fulfilled';
};

export const unsettled = <T>(promise: PromiseSettledResult<T>): promise is PromiseRejectedResult => {
    return promise.status === 'rejected';
};

export const isPromise = <T>(value: unknown): value is Promise<T> => {
    return typeof value === 'object' && value !== null && 'then' in value && typeof (value as any).then === 'function';
};

import { useEffect, useState } from 'react';
import { useBooleanState } from './useBooleanState';

export const usePromise = <T>(promise: Promise<T>) => {
    const [value, setValue] = useState<T | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [loading, startLoading, finishLoading] = useBooleanState(true);

    useEffect(() => {
        startLoading();
        promise.then(setValue).catch(setError).finally(finishLoading);
    }, [finishLoading, promise, startLoading]);

    return [value, { error, setValue, loading }] as const;
};

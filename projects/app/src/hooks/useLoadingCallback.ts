import { promise } from '@untype/toolbox';
import { useState } from 'react';
import { useEvent } from './useEvent';

export const useLoadCallback = <T extends ((...args: any[]) => any) | undefined | null>(
    callback: T,
    initLoading: boolean = false,
): [callback: T, loading: boolean] => {
    const [loading, setLoading] = useState(initLoading);

    const wrapper = useEvent((...args: any[]) => {
        const result = callback?.(...args);
        if (promise.isPromise(result)) {
            setLoading(true);
            return result.finally(() => setLoading(false));
        } else {
            return result;
        }
    });

    return [callback ? (wrapper as T) : callback, loading];
};

import { useCallback } from 'react';
import { useLiveRef } from './useLiveRef';

export const useEvent = <T extends (...args: any[]) => any>(callback: T): T => {
    const ref = useLiveRef(callback);

    return useCallback((...args: any[]) => ref.current?.(...args), []) as T;
};

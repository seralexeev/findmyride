import { useEffect, useRef } from 'react';

export const useUpdateEffect = (effect: React.EffectCallback, deps?: readonly any[]) => {
    const didMountRef = useRef(false);
    useEffect(() => {
        if (didMountRef.current) {
            effect();
        } else {
            didMountRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
};

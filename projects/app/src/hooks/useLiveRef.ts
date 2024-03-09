import { useRef } from 'react';

export const useLiveRef = <T>(value: T) => {
    const ref = useRef(value);
    ref.current = value;

    return ref;
};

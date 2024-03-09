import { useState } from 'react';
import { useEvent } from './useEvent';

export const useBooleanState = (initialState = false) => {
    const [state, setState] = useState(initialState);
    const setTrue = useEvent(() => setState(true));
    const setFalse = useEvent(() => setState(false));
    const toggle = useEvent(() => setState((prev) => !prev));

    return [state, setTrue, setFalse, { setState, toggle }] as const;
};

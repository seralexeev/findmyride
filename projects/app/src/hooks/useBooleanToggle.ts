import { useState } from 'react';
import { useEvent } from './useEvent';

export const useBooleanToggle = (initialState = false) => {
    const [state, setState] = useState(initialState);
    const toggle = useEvent(() => setState((prev) => !prev));

    return [state, toggle, setState] as const;
};

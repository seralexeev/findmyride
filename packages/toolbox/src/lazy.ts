export const lazy = <T>(fn: () => T) => {
    let value: T | undefined;
    let initialized = false;

    return () => {
        if (!initialized) {
            value = fn();
            initialized = true;
        }

        return value as T;
    };
};

export type Lazy<T> = ReturnType<typeof lazy<T>>;

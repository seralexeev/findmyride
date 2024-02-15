export const findObjectKeys = (obj: object) => {
    const result = new Set<keyof any>();

    while (obj) {
        for (const p of Object.getOwnPropertyNames(obj)) {
            result.add(p);
        }

        obj = Object.getPrototypeOf(obj);
    }

    return result;
};

export const pick = <T, K extends keyof T, A = {}>(value: T, keys: readonly K[], additional?: A): Pick<T, K> => {
    const res = keys.reduce(
        (acc, key) => {
            acc[key] = value[key];
            return acc;
        },
        { ...additional } as Pick<T, K>,
    );

    return res as Pick<T, K> & A;
};

export const omit = <T, K extends keyof T>(value: T, keys: readonly K[]): Omit<T, K> => {
    if (!value) {
        return value;
    }

    return Object.keys(value).reduce(
        (acc, key) => {
            if (!keys.includes(key as K)) {
                acc[key as keyof Omit<T, K>] = value[key as keyof Omit<T, K>];
            }
            return acc;
        },
        {} as Omit<T, K>,
    );
};

export const sortAs = <TOrder extends string | number, T>(items: T[], order: TOrder[], selector: (t: T) => TOrder) => {
    const map = order.reduce((acc, item, i) => {
        acc.set(item, i);
        return acc;
    }, new Map<TOrder, number>());

    return [...items].sort((a, b) => (map.get(selector(a)) ?? 0) - (map.get(selector(b)) ?? 0));
};

export const groupBy = <T, K extends string, R = T>(
    arr: T[],
    keySelector: (obj: T, index: number) => K,
    map: (obj: T) => R = (obj) => obj as any,
) => {
    const keySelectorFinally = typeof keySelector === 'function' ? keySelector : (obj: any) => obj[keySelector] as K;

    return arr.reduce(
        (acc, item, index) => {
            const key = keySelectorFinally(item, index);
            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key]?.push(map(item));
            return acc;
        },
        {} as Record<K, R[]>,
    );
};

export const groupByIdentity = <T, G, R>({
    items,
    groupSelector,
    groupIdentity,
    selector,
}: {
    items: T[];
    groupSelector: (item: T) => G;
    groupIdentity: (item: T) => string | number;
    selector: (group: G, items: T[]) => R;
}) => {
    const groups: Record<string | number, { group: G; items: T[] }> = {};

    for (const item of items) {
        const group = groupSelector(item);
        const groupId = groupIdentity(item);
        let groupWrapper = groups[groupId];
        if (!groupWrapper) {
            groupWrapper = groups[groupId] = { group, items: [] };
        }

        groupWrapper.items.push(item);
    }

    return Object.values(groups).map((x) => selector(x.group, x.items));
};

export function reduceBy<T, K extends string, R = T>(
    arr: T[],
    keySelector: (t: T, index: number) => K,
    map?: (t: T, index: number) => R,
): Partial<Record<K, R>>;
export function reduceBy<T, K extends string, R = T>(
    arr: readonly T[],
    keySelector: (t: T, index: number) => K,
    map?: (t: T, index: number) => R,
): Record<K, R>;
export function reduceBy(
    arr: any,
    keySelector: (t: any, index: number) => any,
    map: (t: any, index: number) => any = (t) => t as any,
) {
    const keySelectorFinally = typeof keySelector === 'function' ? keySelector : (t: any) => t[keySelector] as string;

    return (arr as any[]).reduce((acc, item, index) => {
        acc[keySelectorFinally(item, index)] = map(item, index);
        return acc;
    }, {});
}

export const orderAs = <TOrder, T>(order: TOrder[], items: T[], selector: (t: T) => TOrder) => {
    const map = order.reduce((acc, item, i) => {
        acc.set(item, i);
        return acc;
    }, new Map<TOrder, number>());

    return [...items].sort((a, b) => (map.get(selector(a)) ?? 0) - (map.get(selector(b)) ?? 0));
};

export const uniqueBy = <T>(items: T[], keySelector?: (item: T) => unknown) => {
    keySelector ??= (t: T) => t;

    const set = new Set();
    return items.filter((x) => {
        const key = keySelector?.(x);

        if (set.has(key)) {
            return false;
        } else {
            set.add(key);
            return true;
        }
    });
};

export const range = (from: number, to: number) => [...Array(to - from)].map((_, i) => i + from);

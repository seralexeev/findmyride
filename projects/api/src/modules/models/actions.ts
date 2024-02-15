import z from 'zod';

type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V> ? T : never;
type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
    [V in T[K]]: DiscriminateUnion<T, K, V>;
};

export type ActionDef<T extends string, P = undefined> = { type: T; payload: P };
export type Action<A extends UnknownAction> = A extends { type: infer T; payload: infer P }
    ? P extends undefined
        ? { type: T }
        : { type: T; payload: P }
    : never;

export const UnknownAction = z.object({
    type: z.string(),
    payload: z.unknown().optional(),
});

export type UnknownAction = z.infer<typeof UnknownAction>;
export type UnknownActionDef = ActionDef<string, unknown>;

export type ActionType<T extends UnknownAction> = T['type'];
export type ActionMap<A extends UnknownAction> = MapDiscriminatedUnion<A, 'type'>;
export type ActionByType<A extends UnknownAction, S extends ActionType<A>> = Action<ActionMap<A>[S]>;

export const isActionType = <T>(data: unknown, name: string): data is T => {
    if (!data) {
        return false;
    }

    return typeof data === 'object' && (data as any).action === name;
};

export const isAction = <A extends UnknownAction, S extends ActionType<A>>(
    type: S,
    data: unknown,
): data is ActionByType<A, S> => {
    return typeof data === 'object' && (data as any).type === type;
};

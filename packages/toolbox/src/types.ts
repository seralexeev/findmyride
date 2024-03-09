export type Json = JsonPrimitive | Json[] | { [key: string]: Json };
export type JsonPrimitive = string | number | boolean | null;

export type Constructor<T, Arguments extends unknown[] = any[]> = new (...args: Arguments) => T;
export type Class<T, Arguments extends unknown[] = any[]> = Constructor<T, Arguments> & { prototype: T };

export type OmitNever<T> = {
    [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any } ? T[K] : never;
export type AllKeys<T> = T extends any ? keyof T : never;
export type Merge<T extends object> = {
    [K in AllKeys<T>]: PickType<T, K>;
};

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

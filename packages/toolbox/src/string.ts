export const trimToNull = (value: string | null | undefined) => {
    return value?.trim() || null;
};

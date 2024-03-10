import { add, intervalToDuration } from 'date-fns';
import { ComponentType, FC, LegacyRef, MutableRefObject, ReactNode, RefCallback, isValidElement, memo } from 'react';

export const isReactComponent = <T>(Tag: ReactNode | ComponentType<T>): Tag is ComponentType<T> => {
    return Boolean(Tag) && !isValidElement(Tag);
};

export const mergeRefs = <T = any>(...refs: Array<MutableRefObject<T> | LegacyRef<T>>): RefCallback<T> => {
    return (value) => {
        for (const ref of refs) {
            if (typeof ref === 'function') {
                ref(value);
            } else if (ref != null) {
                (ref as MutableRefObject<T | null>).current = value;
            }
        }
    };
};

export const memos = <T extends FC<any>, U extends Record<string, ComponentType<any>>>(target: T, source: U): T & U => {
    return Object.assign(
        memo(target),
        Object.fromEntries(Object.entries(source).map(([key, value]) => [key, memo(value)])) as U,
    );
};

const start = new Date(0);
export const flattenDuration = (duration: Duration) => {
    return intervalToDuration({ start, end: add(start, duration) });
};

export const formatDurationShort = (
    duration: Duration,
    options?: {
        years?: string;
        months?: string;
        days?: string;
        hours?: string;
        minutes?: string;
        seconds?: string;
    },
) => {
    return [
        [duration.years, options?.years ?? 'y'],
        [duration.months, options?.months ?? 'M'],
        [duration.days, options?.days ?? 'd'],
        [duration.hours, options?.hours ?? 'h'],
        [duration.minutes, options?.minutes ?? 'm'],
        [duration.seconds, options?.seconds ?? 's'],
    ]
        .filter((x) => x[0])
        .map(([v, f]) => `${v}${f}`)
        .join(' ');
};

export const truncateDateToUTCStringWithoutTZ = (date: Date) => {
    const padNumber = (value: number) => {
        return value.toString().padStart(2, '0');
    };

    const yyyy = padNumber(date.getFullYear());
    const MM = padNumber(date.getMonth() + 1);
    const dd = padNumber(date.getDate());
    const hh = padNumber(date.getHours());
    const mm = padNumber(date.getMinutes());

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:00`;
};

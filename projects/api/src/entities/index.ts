import { EntityMap } from './generated';

export * from './generated';
export type EntityName = keyof EntityMap;

export const GeoJsonSelector = {
    geojson: true,
} as const;

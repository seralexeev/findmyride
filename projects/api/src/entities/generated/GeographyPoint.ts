/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field } from '@untype/orm';
import { Point } from '@untype/geo';
import { OverrideMap } from '../override';


// prettier-ignore
export interface GeographyPoint extends ApplyOverride<{
    geojson: Field<Point | null, never>;
    latitude: Field<number, never>;
    longitude: Field<number, never>;
    srid: Field<number, never>;
}, OverrideMap['GeographyPoint']> { }

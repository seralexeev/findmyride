/* eslint-disable */
/**
 * This file was automatically generated and should not be edited.
 * If you want to make changes to the entity use migrations instead.
 */

import { ApplyOverride, Field, QueryableListField } from '@untype/orm';
import type { GeographyPoint } from '.';
import { LineString } from '@untype/geo';
import { OverrideMap } from '../override';


// prettier-ignore
export interface GeographyLineString extends ApplyOverride<{
    geojson: Field<LineString | null, never>;
    srid: Field<number, never>;

    points: QueryableListField<GeographyPoint>;
}, OverrideMap['GeographyLineString']> { }

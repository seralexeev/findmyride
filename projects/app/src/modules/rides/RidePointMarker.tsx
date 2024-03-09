import MapboxGL from '@rnmapbox/maps';
import { Point } from '@untype/geo';
import React, { FC, memo } from 'react';
import { ui } from '../../ui';

type RidePointMarkerProps = {
    name: string;
    location?: Point | null;
};

export const RidePointMarker: FC<RidePointMarkerProps> = memo(({ name, location }) => {
    return location ? (
        <MapboxGL.PointAnnotation coordinate={location.coordinates} id={`${name}-title`} anchor={{ x: 0.5, y: -0.3 }}>
            <ui.Text
                variant='body2'
                children={name}
                color='#fff'
                paddingHorizontal='5px'
                paddingVertical='2px'
                borderRadius
                overflowHidden
                bgPalette='secondary'
            />
        </MapboxGL.PointAnnotation>
    ) : null;
});

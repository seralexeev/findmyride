import MapboxGL from '@rnmapbox/maps';
import { Point } from '@untype/geo';
import React, { FC, Fragment, memo } from 'react';
import { icons, ui } from '../../ui';

type RidePointMarkerProps = {
    name: string;
    location?: Point | null;
};

export const RidePointMarker: FC<RidePointMarkerProps> = memo(({ name, location }) => {
    return location ? (
        <Fragment>
            <MapboxGL.PointAnnotation coordinate={location.coordinates} id={`${name}-title`} anchor={{ x: 0.5, y: -0.25 }}>
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
            <MapboxGL.MarkerView coordinate={location.coordinates} id={`${name}-marker`} anchor={{ x: 0.5, y: 1 }}>
                <icons.Marker width={32} height={32} />
            </MapboxGL.MarkerView>
        </Fragment>
    ) : null;
});

import { RidePrivacy, RideVisibility, TrackSource } from '@findmyride/api';
import { CameraProps } from '@rnmapbox/maps/lib/typescript/src/components/Camera';
import * as turf from '@turf/turf';
import { BoundingBox, Feature, LocationWithName, Point } from '@untype/geo';
import { ComponentType } from 'react';
import { SvgProps } from 'react-native-svg';
import { icons } from '../../../ui';

export type TrackSourceConfig = {
    type: TrackSource;
    Icon: ComponentType<SvgProps>;
    title: string;
    fillIcon: boolean;
    name: string;
    linkExample?: string;
};

export const trackSourceInfos: Record<TrackSource, TrackSourceConfig> = {
    manual: { type: 'manual', Icon: icons.Location, name: 'Manual', title: 'Select on the Map', fillIcon: false },
    gpx: { type: 'gpx', Icon: icons.FileGpx, name: 'GPX', title: 'Upload GPX File', fillIcon: true },
    strava: { type: 'strava', Icon: icons.StravaLogo, name: 'Strava', title: 'Import from Strava', fillIcon: false },
    komoot: {
        type: 'komoot',
        Icon: icons.KomootLogo,
        name: 'Komoot',
        title: 'Import from Komoot',
        fillIcon: false,
        linkExample: 'https://www.komoot.com/tour/123456789',
    },
    rwg: {
        type: 'rwg',
        Icon: icons.RwgLogo,
        name: 'Ride with GPS',
        title: 'Import from Ride with GPS',
        fillIcon: false,
        linkExample: 'https://ridewithgps.com/routes/123456789',
    },
};

export const getTrackSourceConfig = (source: TrackSource) => {
    return (
        trackSourceInfos[source] ?? {
            fillIcon: true,
            name: 'Unknown',
            title: 'Unknown',
            type: 'manual',
            Icon: icons.BikeTypeRoad,
        }
    );
};

export const getRidePrivacyConfig = (privacy: RidePrivacy) => {
    return (
        privacyMap[privacy] ?? {
            title: 'Unknown',
            Icon: icons.BikeTypeRoad,
        }
    );
};

const privacyMap = {
    private: {
        title: 'Approved only',
        Icon: icons.Check,
        description: 'Only people that you approve can attend the ride',
    },
    public: {
        title: 'Public',
        Icon: icons.Public,
        description: 'Allows anyone to join without approval',
    },
};

export const getRideVisibilityConfig = (visibility: RideVisibility) => {
    return (
        visibilityMap[visibility] ?? {
            title: 'Unknown',
            Icon: icons.BikeTypeRoad,
        }
    );
};

const visibilityMap = {
    anyone: {
        title: 'Visible for Everyone',
        Icon: icons.Visibility,
    },
    followers: {
        title: 'My Followers',
        Icon: icons.Profile,
    },
    follows: {
        title: 'People I Follow',
        Icon: icons.Profile,
    },
    link: {
        title: 'With a Link Only',
        Icon: icons.Link,
    },
};

export const getRideCamera = (ride: {
    start?: LocationWithName | null;
    finish?: LocationWithName | null;
    bbox: BoundingBox | null;
}): CameraProps | null => {
    if (ride.bbox) {
        return {
            bounds: { ...ride.bbox, ...bboxPaddings },
            animationDuration: 0,
        };
    }

    if (!ride.start?.location && !ride.finish?.location) {
        return null;
    }

    const items: Array<Feature<Point>> = [];

    if (ride.start) {
        items.push({
            type: 'Feature',
            geometry: ride.start.location,
            properties: null,
        });
    }

    if (ride.finish) {
        items.push({
            type: 'Feature',
            geometry: ride.finish.location,
            properties: null,
        });
    }

    if (items.length === 1) {
        return {
            centerCoordinate: items[0]?.geometry.coordinates,
            animationDuration: 500,
            zoomLevel: 12,
        };
    }

    const bbox = turf.bbox(turf.featureCollection(items));
    return {
        bounds: {
            ne: [bbox[0], bbox[1]],
            sw: [bbox[2], bbox[3]],
            ...bboxPaddings,
        },
        maxZoomLevel: 16,
        animationDuration: 500,
    };
};

const bboxPaddings = {
    paddingLeft: 32,
    paddingBottom: 64 + 64,
    paddingRight: 32,
    paddingTop: 64,
};

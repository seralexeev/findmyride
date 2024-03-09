import { BikeType, RidePrivacy, RideVisibility, RiderLevel, RpcEndpoint, RpcOutput, TrackSource } from '@findmyride/api';
import { BoundingBox, LineString, LocationWithName } from '@untype/geo';
import { object } from '@untype/toolbox';
import React, { Dispatch, FC, ReactNode, SetStateAction, useMemo, useState } from 'react';
import { useRpc } from '../../../api/rpc';
import { createUseContext } from '../../../hooks/createUseContext';
import { useEvent } from '../../../hooks/useEvent';
import { useScreen } from '../../../ui/ScreenProvider';
import { useFileUpload } from '../../files/useFileUpload';
import { useSelectStravaRoute } from '../../strava/StravaRidesScreen';
import { ParseFromLinkScreen } from './ParseFromLinkScreen';

export const [useCreateRide, Provider] = createUseContext<{
    ride: CreateRideVm;
    setRide: Dispatch<SetStateAction<CreateRideVm>>;
    setLoading: (loading: boolean) => void;
    loading: boolean;
}>('CreateRideProvider');

export const createEmptyCreateRideModel = (initial: Partial<CreateRideVm>): CreateRideVm => ({
    trackSource: 'manual',
    trackSourceUrl: null,
    gpxTrackId: null,
    startDate: null,
    start: null,
    finish: null,
    track: null,
    bbox: null,
    bikeType: 'road',
    manualDistance: null,
    calculatedDistance: null,
    distanceToStart: null,
    elevation: null,
    riderLevel: 'intermediate',
    privacy: 'public',
    visibility: 'anyone',
    title: null,
    description: null,
    startTimezone: null,
    autoStart: true,
    autoFinish: null,
    chatLink: null,
    gpxTrackUrl: null,
    termsUrl: null,
    ...initial,
});

export const CreateRideProvider: FC<{ model: CreateRideVm; children: ReactNode }> = ({ children, model }) => {
    const [ride, setRide] = useState<CreateRideVm>(model);
    const [loading, setLoading] = useState(false);
    const value = useMemo(() => ({ ride, setRide, loading, setLoading }), [ride, loading]);

    return <Provider value={value} children={children} />;
};

export type CreateRideVm = {
    trackSource: TrackSource;
    trackSourceUrl: string | null;
    gpxTrackId: string | null;
    bikeType: BikeType;
    manualDistance: number | null;
    calculatedDistance: number | null;
    distanceToStart: number | null;
    riderLevel: RiderLevel;
    elevation: number | null;
    startDate: Date | null;
    start: LocationWithName | null;
    finish: LocationWithName | null;
    track: LineString | null;
    bbox: BoundingBox | null;
    privacy: RidePrivacy;
    visibility: RideVisibility;
    title: string | null;
    description: string | null;
    startTimezone: { id: string; name: string } | null;
    autoStart: boolean;
    autoFinish: number | null;
    chatLink: string | null;
    gpxTrackUrl: string | null;
    termsUrl: string | null;
};

const mapGpxToCreateModel = (
    gpx: RpcOutput<'geo/upload_gpx'>,
    source: { trackSource: TrackSource; trackSourceUrl?: string },
): Partial<CreateRideVm> => {
    return {
        ...object.pick(gpx, [
            'start',
            'finish',
            'track',
            'bbox',
            'manualDistance',
            'calculatedDistance',
            'elevation',
            'distanceToStart',
            'startTimezone',
            'gpxTrackUrl',
        ]),
        ...source,
        gpxTrackId: gpx.id,
    };
};

export const useCreateFromStravaRoute = () => {
    const [mutateAsync] = useRpc('strava/import_gpx').useMutation();
    const selectRoute = useSelectStravaRoute();

    return useEvent(async () => {
        const routeId = await selectRoute();
        const gpx = await mutateAsync({ routeId });

        return mapGpxToCreateModel(gpx, object.pick(gpx, ['trackSource', 'trackSourceUrl']));
    });
};

export const useGpxUpload = () => {
    const { upload } = useFileUpload();
    const [mutateAsync] = useRpc('geo/upload_gpx').useMutation();

    return async () => {
        const file = await upload('file');
        const gpx = await mutateAsync(file);

        return mapGpxToCreateModel(gpx, { trackSource: 'gpx' });
    };
};

const getEndpoint = (trackSource: TrackSource) => {
    switch (trackSource) {
        case 'rwg':
            return 'rwg/parse' satisfies RpcEndpoint;
        case 'komoot':
            return 'komoot/parse' satisfies RpcEndpoint;
        default:
            return null;
    }
};

export const useUrlParseSource = () => {
    const { showScreen } = useScreen();

    return (trackSource: TrackSource, prefilledUrl?: string) => {
        return new Promise<Partial<CreateRideVm>>((res, rej) => {
            const endpoint = getEndpoint(trackSource);
            if (!endpoint) {
                return rej(new Error('Cancel'));
            }

            showScreen({
                onClose: rej,
                children: (
                    <ParseFromLinkScreen
                        onSuccess={(trackSourceUrl: string, trackSource: TrackSource, gpx: RpcOutput<'geo/upload_gpx'>) => {
                            res(mapGpxToCreateModel(gpx, { trackSource, trackSourceUrl }));
                        }}
                        endpoint={endpoint}
                        trackSource={trackSource}
                        prefilledUrl={prefilledUrl}
                    />
                ),
            });
        });
    };
};

export const useManualSource = () => {
    return (): Partial<CreateRideVm> => {
        return {
            trackSource: 'manual',
        };
    };
};

export const useRidePoint = () => {
    const { setRide } = useCreateRide();
    const [getTimezone] = useRpc('geo/timezone').useMutation();

    const onSelectLocation = useEvent(async (point: 'start' | 'finish', value: LocationWithName) => {
        if (point === 'start') {
            const { timeZoneName, timeZoneId } = await getTimezone({ coordinates: value.location.coordinates });
            setRide((prev) => ({ ...prev, startTimezone: { id: timeZoneId, name: timeZoneName } }));
        }

        setRide((prev) => ({ ...prev, [point]: value }));
    });

    return onSelectLocation;
};

import { ParticipantStatus, RideStatus, RpcOutput } from '@findmyride/api';
import { LocationWithName } from '@untype/geo';
import { assert, object } from '@untype/toolbox';
import { formatDistanceToNow, isPast } from 'date-fns';
import React from 'react';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { useEvent } from '../../../hooks/useEvent';
import { useScreen } from '../../../ui/ScreenProvider';
import { Theme } from '../../../ui/theme';
import { BikeTypeSelector } from '../create/BikeTypeSelector';
import { RideAdditionalOptionsScreen } from '../create/CreateRideAdditionalOptionsScreen';
import { CreateRideMainScreen } from '../create/CreateRideMainScreen';
import { RiderLevelSelector } from '../create/RideLevelSelector';
import { CreateRideProvider, createEmptyCreateRideModel } from '../create/services';

export const useUpdateRide = (ride: RpcOutput<'ride/get'> | undefined) => {
    const [getTimezone] = useRpc('geo/timezone').useMutation();
    const { showScreen } = useScreen();
    const [mutateAsync] = useRpc('ride/update').useMutation();
    const invalidate = useInvalidate();
    const invalidateAll = () => invalidate(['ride/get', 'ride/find']);

    if (!ride || !ride.isOrganizer || (ride.status !== 'created' && ride.status !== 'started')) {
        return {};
    }

    const onRiderLevelClick = () => {
        showScreen({
            children: (
                <RiderLevelSelector.Screen
                    value={ride.riderLevel}
                    onChange={(riderLevel) => mutateAsync({ id: ride.id, riderLevel }).then(invalidateAll)}
                />
            ),
        });
    };

    const onBikeTypeClick = () => {
        showScreen({
            children: (
                <BikeTypeSelector.Screen
                    value={ride.bikeType}
                    onChange={(bikeType) => mutateAsync({ id: ride.id, bikeType }).then(invalidateAll)}
                />
            ),
        });
    };

    const onDescriptionChange = (description: string) => {
        return mutateAsync({ id: ride.id, description }).then(invalidateAll);
    };

    const onTitleChange = (title: string) => {
        return mutateAsync({ id: ride.id, title }).then(invalidateAll);
    };

    const onChatLinkChange = (chatLink: string) => {
        return mutateAsync({ id: ride.id, chatLink }).then(invalidateAll);
    };

    const onTermsUrlChange = (termsUrl: string) => {
        return mutateAsync({ id: ride.id, termsUrl }).then(invalidateAll);
    };

    const onAdditionalClick = () => {
        return showScreen({
            children: (
                <RideAdditionalOptionsScreen
                    value={object.pick(ride, ['privacy', 'visibility', 'autoStart', 'autoFinish'])}
                    onChange={(value) => mutateAsync({ id: ride.id, ...value }).then(invalidateAll)}
                />
            ),
        });
    };

    const onAutoFinishChange = (autoFinish: number | null) => {
        return mutateAsync({ id: ride.id, autoFinish }).then(invalidateAll);
    };

    const onChangeLocation = async (point: 'start' | 'finish', value: LocationWithName) => {
        if (point === 'start') {
            const { timeZoneName, timeZoneId } = await getTimezone({ coordinates: value.location.coordinates });

            return mutateAsync({
                id: ride.id,
                startTimezone: { id: timeZoneId, name: timeZoneName },
                start: value,
            }).then(invalidateAll);
        }

        return mutateAsync({ id: ride.id, finish: value }).then(invalidateAll);
    };

    const onStartDateChange = (startDate: Date) => {
        return mutateAsync({ id: ride.id, startDate: truncateDateToUTCStringWithoutTZ(startDate) }).then(invalidateAll);
    };

    return {
        onRiderLevelClick,
        onBikeTypeClick,
        onChatLinkChange,
        onDescriptionChange,
        onTitleChange,
        onAdditionalClick,
        onChangeLocation,
        onStartDateChange,
        onAutoFinishChange,
        onTermsUrlChange,
    };
};

export const useAdminRideManagement = (onSuccess?: () => void) => {
    const invalidate = useInvalidate();
    const [sendRideAction] = useRpc('ride_ops/action').useMutation();

    return useEvent((action: RideAction) => {
        return sendRideAction(action)
            .then(() => invalidate(['ride/get', 'ride/find', 'home/data']))
            .then(onSuccess);
    });
};

export const useRepeatRide = () => {
    const { showScreen } = useScreen();
    const [mutateAsync] = useRpc('ride/get').useMutation();

    return useEvent((id: string) => {
        return mutateAsync({ id }).then((x) => {
            const model = createEmptyCreateRideModel(
                object.pick(x, [
                    'trackSource',
                    'trackSourceUrl',
                    'gpxTrackId',
                    'bikeType',
                    'manualDistance',
                    'calculatedDistance',
                    'distanceToStart',
                    'riderLevel',
                    'elevation',
                    'start',
                    'finish',
                    'track',
                    'bbox',
                    'privacy',
                    'visibility',
                    'description',
                    'startTimezone',
                ]),
            );

            showScreen({
                children: (
                    <CreateRideProvider model={model}>
                        <CreateRideMainScreen />
                    </CreateRideProvider>
                ),
            });
        });
    });
};

export const getParticipantStatusColor = (status: ParticipantStatus): keyof Theme['colors'] | undefined => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'declined':
            return 'danger';
    }
};

export const getRideStatusTitle = (ride: {
    status: RideStatus;
    startDate: Date | string;
    startedAt: Date | string | null;
    finishedAt: Date | string | null;
}): string => {
    const start = new Date(ride.startDate);

    switch (ride.status) {
        case 'started':
            return ride.startedAt ? `🚀  Started ${formatDistanceToNow(new Date(ride.startedAt))} ago` : '🚀  Started';
        case 'finished':
            return ride.startedAt ? `🏁  Finished ${formatDistanceToNow(new Date(ride.startedAt))} ago` : '🏁  Finished';
        case 'created':
            return isPast(start)
                ? `🤔  Expected to start ${formatDistanceToNow(start)} ago`
                : `🗓  Starts in ${formatDistanceToNow(start)}`;
        case 'canceled':
            return 'Canceled';
        default:
            assert.never(ride.status);
    }
};

export const getRideStatusColor = (status: RideStatus): keyof Theme['colors'] | undefined => {
    switch (status) {
        case 'started':
            return 'success';
        case 'created':
            return 'success';
        case 'canceled':
            return 'danger';
    }
};

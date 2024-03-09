import { RideStatus, RpcOutput } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { icons, ui, withConfirm } from '../../../ui';
import { useAdminRideManagement, useRepeatRide } from './services';

type OrganizerActionsProps = {
    ride: {
        id: string;
        status: RideStatus;
        isEditable: boolean;
    };
    onUpdate?: () => void;
};

export const OrganizerActions: FC<OrganizerActionsProps> = memo(({ ride, onUpdate }) => {
    const rideAction = useAdminRideManagement(onUpdate);
    const repeatRide = useRepeatRide();

    return (
        <ui.Stack row spacing>
            {ride.status === 'created' && (
                <ui.Button
                    children='🚀  Start Ride'
                    borderVariant='round'
                    onPress={withConfirm({
                        title: 'Start the Ride',
                        subtitle: 'Are you sure?',
                        action: () => rideAction({ type: '@ride/START', payload: { rideId: ride.id } }),
                    })}
                />
            )}

            {ride.status === 'started' && (
                <ui.Button
                    children='Finish the Ride'
                    StartIcon={icons.Finish}
                    borderVariant='round'
                    onPress={withConfirm({
                        title: 'Finish the Ride',
                        subtitle: 'Are you sure?',
                        action: () => rideAction({ type: '@ride/FINISH', payload: { rideId: ride.id } }),
                    })}
                />
            )}

            {!ride.isEditable && (
                <ui.Button
                    children='Repeat'
                    color='secondary'
                    borderVariant='round'
                    StartIcon={icons.Repeat}
                    onPress={() => repeatRide(ride.id)}
                />
            )}
        </ui.Stack>
    );
});

export const CancelButton: FC<{ ride: RpcOutput<'ride/get'> }> = memo(({ ride }) => {
    const rideAction = useAdminRideManagement();

    return ride.isOrganizer && ride.isEditable ? (
        <ui.Button
            children='Cancel the Ride'
            color='secondary'
            onPress={withConfirm({
                title: 'Cancel the Ride',
                subtitle: 'Are you sure?',
                action: () => rideAction({ type: '@ride/CANCEL', payload: { rideId: ride.id } }),
            })}
        />
    ) : null;
});

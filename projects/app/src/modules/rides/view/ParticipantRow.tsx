import { RpcInput, RpcItemsOutput, RpcOutput } from '@findmyride/api';
import { capitalCase } from 'change-case';
import React, { FC, useState } from 'react';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { icons, ui } from '../../../ui';
import { useProfile } from '../../user/ProfileProvider';
import { UserMediaCard } from '../../user/UserMediaCard';
import { getParticipantStatusColor } from './services';

type ParticipantRowProps = {
    item: RpcItemsOutput<'ride_ops/find_participants'>;
    ride: RpcOutput<'ride/get'>;
};

export const ParticipantRow: FC<ParticipantRowProps> = ({ item, ride }) => {
    const [state, setState] = useState(item);
    const [mutateAsync] = useRpc('ride_ops/invite').useMutation();
    const inviteUser = (userId: string) => mutateAsync({ rideId: ride.id, userId });
    const [approveOrDeclineReq] = useRpc('ride_ops/set_participant_status').useMutation();
    const invalidate = useInvalidate();
    const { profile } = useProfile();

    const getAux = () => {
        if (!ride.isEditable || item.user.id === profile.id) {
            return null;
        }

        if (!state.status) {
            return (
                <ui.Button
                    haptic
                    flex
                    size='small'
                    children='Invite'
                    onPress={() => inviteUser(state.user.id).then(setState)}
                />
            );
        }

        if (ride.isOrganizer) {
            const changeParticipantStatus = (userId: string, status: RpcInput<'ride_ops/set_participant_status'>['status']) => {
                return approveOrDeclineReq({ rideId: ride.id, status, userId }).then(async (x) => {
                    await invalidate(['ride/get']);
                    return x;
                });
            };

            const approveProps = {
                haptic: true,
                flex: 1,
                StartIcon: icons.Check,
                onPress: () => changeParticipantStatus(state.user.id, 'approved').then(setState),
            };

            const declineProps = {
                haptic: true,
                flex: 1,
                StartIcon: icons.Cross,
                onPress: () => changeParticipantStatus(state.user.id, 'declined').then(setState),
            };

            switch (state.status) {
                case 'invited':
                case 'approved': {
                    return <ui.Button {...declineProps} size='small' color='tertiary' children='Decline' />;
                }
                case 'declined': {
                    return <ui.Button {...approveProps} size='small' color='tertiary' children='Approve' />;
                }
                case 'pending': {
                    return (
                        <ui.Stack spacing={2} row justifyContent='space-between'>
                            <ui.Button {...approveProps} color='success' borderVariant='round' />
                            <ui.Button {...declineProps} color='danger' borderVariant='round' />
                        </ui.Stack>
                    );
                }
            }
        }

        return null;
    };

    return (
        <UserMediaCard
            user={state.user}
            subtitle={
                state.status && (
                    <ui.Text
                        variant='caption'
                        colorPalette={getParticipantStatusColor(state.status)}
                        children={capitalCase(state.status)}
                    />
                )
            }
            aux={<ui.Box row flex flexCenter width={104} marginRight children={getAux()} />}
        />
    );
};

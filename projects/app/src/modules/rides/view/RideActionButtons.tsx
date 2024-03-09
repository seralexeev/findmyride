import { ParticipantStatus, RideStatus, RpcInput, routes } from '@findmyride/api';
import { useLinkTo } from '@react-navigation/native';
import { capitalCase } from 'change-case';
import React, { FC } from 'react';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { useBooleanState } from '../../../hooks/useBooleanState';
import { icons, ui, withConfirm } from '../../../ui';
import { useBottomSheet } from '../../../ui/BottomSheetProvider';
import { OrganizerActions } from './OrganizerActions';
import { useShareRide } from './ShareButton';

type RideActionButtonsProps = {
    ride: {
        id: string;
        status: RideStatus;
        participantStatus: ParticipantStatus | null;
        isEditable: boolean;
        isOrganizer: boolean;
        termsUrl: string | null;
        organizer: { name: string };
    };
    onUpdate?: () => void;
};

export const RideActionButtons: FC<RideActionButtonsProps> = ({ ride, onUpdate }) => {
    if (ride.isOrganizer) {
        return <OrganizerActions ride={ride} />;
    }

    return <ParticipantButtons ride={ride} onUpdate={onUpdate} />;
};

type ParticipantButtonsProps = {
    size?: ui.ButtonProps['size'];
    ride: {
        id: string;
        status: RideStatus;
        participantStatus: ParticipantStatus | null;
        isOrganizer: boolean;
        organizer: { name: string };
        termsUrl: string | null;
    };
    onUpdate?: () => void;
};

export const ParticipantButtons: FC<ParticipantButtonsProps> = ({ ride, size, onUpdate }) => {
    if (ride.isOrganizer || ride.status === 'canceled' || ride.status === 'finished') {
        return null;
    }

    if (!ride.participantStatus) {
        return (
            <ActionButton
                ride={ride}
                action='join'
                color='primary'
                children='Join'
                minWidth={96}
                size={size}
                onUpdate={onUpdate}
            />
        );
    }

    switch (ride.participantStatus) {
        case 'approved':
        case 'pending': {
            return (
                <ActionButton
                    ride={ride}
                    action='leave'
                    color='secondary'
                    children='Leave'
                    minWidth={96}
                    size={size}
                    onUpdate={onUpdate}
                />
            );
        }
        case 'invited': {
            return (
                <ui.Stack row spacing>
                    <ActionButton
                        ride={ride}
                        action='refuse'
                        color='tertiary'
                        StartIcon={icons.Cross}
                        size={size}
                        onUpdate={onUpdate}
                    />
                    <ActionButton
                        ride={ride}
                        action='accept'
                        color='primary'
                        children='Accept'
                        minWidth={96}
                        size={size}
                        onUpdate={onUpdate}
                    />
                </ui.Stack>
            );
        }
        case 'left':
        case 'refused': {
            return (
                <ActionButton
                    ride={ride}
                    action='join'
                    color='primary'
                    children='Join'
                    minWidth={96}
                    size={size}
                    onUpdate={onUpdate}
                />
            );
        }
    }

    return null;
};

type ActionButtonProps = ui.ButtonProps & {
    size?: ui.ButtonProps['size'];
    ride: {
        id: string;
        status: RideStatus;
        termsUrl: string | null;
        organizer: { name: string };
    };
    action: RpcInput<'ride_ops/join_leave'>['action'];
    onUpdate?: () => void;
};

const ActionButton: FC<ActionButtonProps> = ({ ride, action, size, onUpdate, ...rest }) => {
    const [mutateAsync] = useRpc('ride_ops/join_leave').useMutation();
    const invalidate = useInvalidate();
    const showSharePopup = useSharePopup();
    const showBottomSheet = useBottomSheet();

    let actionCallback: () => any = () => {
        return mutateAsync({ rideId: ride.id, action })
            .then(() => invalidate(['ride/get', 'ride_ops/find_participants', 'ride/find', 'ride/get_preview']))
            .then(() => {
                if (action === 'join' || action === 'accept') {
                    showSharePopup({
                        title: 'You have joined the Ride!',
                        ride,
                    });
                }

                return onUpdate?.();
            });
    };

    switch (action) {
        case 'leave':
        case 'refuse': {
            actionCallback = withConfirm({
                title: `${capitalCase(action)} the Ride`,
                subtitle: 'Are you sure?',
                action: actionCallback,
            });
            break;
        }
        case 'accept':
        case 'join': {
            const callback = actionCallback;
            actionCallback = () => {
                if (ride.termsUrl) {
                    showBottomSheet({
                        position: 260,
                        children: ({ close }) => (
                            <ui.Box flex>
                                <ui.Box paddingHorizontal={4} flex>
                                    <ui.Box flex flexCenter>
                                        <ui.Text
                                            variant='title2'
                                            children='To join the ride you need to accept terms and conditions of the ride'
                                        />
                                    </ui.Box>
                                    <ui.Button
                                        onPress={() => InAppBrowser.open(ride.termsUrl as string)}
                                        children='Open Terms and Conditions'
                                        color='tertiary'
                                        marginBottom={2}
                                    />
                                </ui.Box>
                                <ui.Box paddingHorizontal={4} paddingBottom={4} row>
                                    <ui.Button
                                        children='Accept'
                                        flex
                                        marginRight
                                        onPress={() => Promise.resolve(callback()).then(close)}
                                    />
                                    <ui.Button children='Decline' color='secondary' flex marginLeft onPress={close} />
                                </ui.Box>
                            </ui.Box>
                        ),
                    });
                } else {
                    return callback();
                }
            };
            break;
        }
    }

    return <ui.Button borderVariant='round' haptic onPress={actionCallback} {...rest} size={size} />;
};

export const useSharePopup = () => {
    const showBottomSheet = useBottomSheet();

    return ({ title, ride }: { title: string; ride: { id: string; organizer: { name: string } } }) => {
        showBottomSheet({
            position: 400,
            children: ({ close }) => <ShareView ride={ride} onClose={close} title={title} />,
            props: {
                detached: true,
                bottomInset: 250,
                handleComponent: () => null,
                backgroundStyle: { marginHorizontal: 32 },
            },
        });
    };
};

type ShareViewProps = {
    ride: {
        id: string;
        organizer: { name: string };
    };
    title: string;
    onClose: () => void;
};

const ShareView: FC<ShareViewProps> = ({ ride, onClose, title }) => {
    const [finished, finish] = useBooleanState();
    const share = useShareRide(ride);
    const linkTo = useLinkTo();

    return (
        <ui.Box flexCenter padding flex paddingTop={6} paddingBottom={4}>
            <ui.Text center variant='title2' children={title} />
            <ui.Box flex flexCenter fullWidth>
                {finished ? (
                    <ui.Transition inAnimation='fadeIn' flex flexCenter fullWidth>
                        <ui.Box flex flexCenter justifyContent='flex-end'>
                            <ui.Box flex flexCenter>
                                <ui.Text children='🚀' fontSize={36} lineHeight={46} />
                            </ui.Box>
                            <ui.Text children="Don't forget to share the Ride!" marginBottom={2} variant='caption' />
                        </ui.Box>
                        <ui.Button
                            borderVariant='round'
                            marginBottom
                            fullWidth
                            size='large'
                            width={200}
                            color='secondary'
                            children='Share'
                            StartIcon={icons.Share}
                            onPress={() => {
                                onClose();
                                share();
                            }}
                        />
                        <ui.Button
                            borderVariant='round'
                            size='large'
                            width={200}
                            color='primary'
                            children='Invite Riders'
                            StartIcon={icons.Plus}
                            onPress={() => {
                                onClose();
                                linkTo(`${routes.ride(ride.id)}?tab=participants`);
                            }}
                        />
                    </ui.Transition>
                ) : (
                    <ui.LottieBox
                        source={require('../../../ui/lottie/confetti.json')}
                        autoPlay
                        loop={false}
                        wh={196}
                        speed={2}
                        onAnimationFinish={finish}
                    />
                )}
            </ui.Box>
        </ui.Box>
    );
};

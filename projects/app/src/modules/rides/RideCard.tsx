import { RpcOutput } from '@findmyride/api';
import { object } from '@untype/toolbox';
import React, { FC, memo, useState } from 'react';
import { useRpc } from '../../api/rpc';
import { useEvent } from '../../hooks/useEvent';
import { icons, ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { useProfile } from '../user/ProfileProvider';
import { UserAvatarStack } from '../user/UserAvatarStack';
import { UserMediaCard } from '../user/UserMediaCard';
import { RideMeta } from './RideMeta';
import { RideActionButtons } from './view/RideActionButtons';
import { RideProfile } from './view/RideProfileScreen';
import { getRideStatusTitle } from './view/services';

type RideCardProps = {
    ride: RpcOutput<'ride/get_preview'>;
    compact?: boolean;
};

export const RideCard: FC<RideCardProps> = memo(function RideCard({ compact, ...props }) {
    const { showScreen } = useScreen();
    const [ride, setRide] = useState(props.ride);
    const [mutateAsync] = useRpc('ride/get_preview').useMutation({ onSuccess: setRide });
    const { profile } = useProfile();

    const onPress = useEvent(() => {
        return showScreen({ children: <RideProfile id={ride.id} /> });
    });

    const plusRides = ride.participantCount - ride.participantPick.length;

    return (
        <ui.Box borderRadius backgroundColor='#fff' borderColor borderWidth overflowHidden>
            <ui.Box onPress={onPress} pressOpacity={compact ? 1 : undefined}>
                <ui.Box paddingHorizontal paddingTop>
                    <UserMediaCard
                        navigateByName={false}
                        user={ride.organizer}
                        title={ride.title}
                        subtitle={
                            <ui.Box row alignItems='center'>
                                <icons.Marker width={12} height={12} />
                                <ui.Text marginLeft={0.5} variant='caption' numberOfLines={1} children={ride.start.name} flex />
                            </ui.Box>
                        }
                        numberOfSubtitleLines={1}
                        marginBottom
                        aux={
                            <ui.Box flex justifyContent='center' alignItems='flex-end' marginRight>
                                <ui.Text semiBold children={ride.localStartDateString} />
                                <ui.Text variant='caption' children={ride.localStartTimeString} />
                            </ui.Box>
                        }
                    />
                </ui.Box>
                <ui.Divider marginBottom={0.5} />
                <ui.Box marginBottom={0.5}>
                    <RideMeta ride={ride} showAutoFinish />
                </ui.Box>

                {!compact && (
                    <ui.Box>
                        <ui.Divider />
                        <ui.Box>
                            <ui.FileImage
                                image={ride.staticMap}
                                aspectRatio={2}
                                overflowHidden
                                borderTopWidth
                                borderBottomWidth
                                borderColor
                            />
                        </ui.Box>

                        <ui.Stack
                            position='absolute'
                            left
                            top
                            spacing
                            row
                            children={ride.images.map((x) => (
                                <ui.FileImage
                                    key={x.id}
                                    image={x}
                                    width={32}
                                    height={32}
                                    borderRadius={1}
                                    overflowHidden
                                    resizeMode='cover'
                                    aspectRatio={1}
                                />
                            ))}
                        />

                        <ui.Box position='absolute' right bottom>
                            <ui.Box row alignItems='center' shadow>
                                <UserAvatarStack
                                    users={
                                        ride.participantStatus === 'approved' || ride.participantStatus === 'pending'
                                            ? [
                                                  ...ride.participantPick.filter((x) => x.id !== profile.id),
                                                  object.pick(profile, ['id', 'name', 'avatar']),
                                              ]
                                            : ride.participantPick
                                    }
                                    size={32}
                                />
                                {plusRides > 0 && (
                                    <ui.Box flexCenter round wh={32} white marginLeft>
                                        <ui.Text semiBold variant='caption' children={`+${plusRides}`} />
                                    </ui.Box>
                                )}
                            </ui.Box>
                        </ui.Box>
                    </ui.Box>
                )}
            </ui.Box>
            <ui.Box row alignItems='center' padding minHeight={52} borderTopWidth borderColor>
                <ui.Box flex row paddingLeft>
                    <ui.Text semiBold children={getRideStatusTitle(ride)} />
                </ui.Box>
                <ui.Box row alignItems='center'>
                    <RideActionButtons ride={ride} onUpdate={() => mutateAsync({ id: ride.id })} />
                </ui.Box>
            </ui.Box>
        </ui.Box>
    );
});

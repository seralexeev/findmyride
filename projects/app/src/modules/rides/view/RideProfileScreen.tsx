import BottomSheet from '@gorhom/bottom-sheet';
import { useRoute } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { addHours } from 'date-fns';
import dedent from 'dedent';
import React, { FC, memo, useEffect } from 'react';
import * as AddCalendarEvent from 'react-native-add-calendar-event';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRpc } from '../../../api/rpc';
import { icons, ui } from '../../../ui';
import { useTheme } from '../../../ui/ThemeProvider';
import { useBottomSheetHelper } from '../../../ui/components';
import { ChatButton } from '../../chat/ChatButton';
import { useOpenChatRoom } from '../../chat/services';
import { InteractiveMap } from '../../map/InteractiveMap';
import { UserMediaCard } from '../../user/UserMediaCard';
import { RideChatLink, RideDescription } from '../RideDescription';
import { RideMeta } from '../RideMeta';
import { RidePointButton } from '../RidePointButton';
import { RidePointMarker } from '../RidePointMarker';
import { RideStartDateTimeButton } from '../RideStartDateTimeButton';
import { EstimationSelector } from '../create/EstimationSelector';
import { RideChips } from '../create/RideChips';
import { getRideCamera } from '../create/utils';
import { CancelButton } from './OrganizerActions';
import { ParticipatesList } from './ParticipatesList';
import { RideActionButtons, useSharePopup } from './RideActionButtons';
import { RideImageGallery } from './RideImageGallery';
import { ShareButton } from './ShareButton';
import { getRideStatusTitle, useUpdateRide } from './services';

export const RideProfileScreen: FC = memo(() => {
    const route = useRoute<any>();

    return <RideProfile id={route.params.id} tab={route.params.tab} showPopup={Boolean(route.params.popup)} />;
});

type RideProfileProps = {
    id: string;
    tab?: string;
    showPopup?: boolean;
};

const bottomSnapPoint = 450;
const snapPoints = [bottomSnapPoint, '100%'];
export const RideProfile: FC<RideProfileProps> = memo(({ id, tab, showPopup }) => {
    const { bottom } = useSafeAreaInsets();
    const showSharePopup = useSharePopup();
    const openChat = useOpenChatRoom();
    const { colors } = useTheme();
    const rideQuery = useRpc('ride/get').useQuery({ input: { id } });
    const {
        onBikeTypeClick,
        onRiderLevelClick,
        onDescriptionChange,
        onTitleChange,
        onChatLinkChange,
        onAdditionalClick,
        onChangeLocation,
        onStartDateChange,
        onAutoFinishChange,
        onTermsUrlChange,
    } = useUpdateRide(rideQuery.data);

    const [bottomSheetRef, bottomSheetProps] = useBottomSheetHelper(snapPoints, {
        withRounds: true,
    });

    useEffect(() => {
        if (showPopup && rideQuery.data) {
            showSharePopup({
                title: 'The Ride has been Created!',
                ride: rideQuery.data,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPopup, Boolean(rideQuery.data)]);

    if (!rideQuery.isSuccess) {
        return (
            <ui.Screen name='RideProfileScreen' header='Ride' backgroundColor='#fff' bottomSafeArea={false}>
                <ui.FetchFallback query={rideQuery} spinner />
            </ui.Screen>
        );
    }

    const expandBottomSheet = () => bottomSheetRef.current?.expand();

    const ride = rideQuery.data;

    return (
        <ui.Screen
            white
            name='RideProfileScreen'
            header={<ui.Text children={getRideStatusTitle(ride)} semiBold center />}
            bottomSafeArea={false}
            headerRight={<ShareButton ride={ride} />}
        >
            <ui.Box flex overflowHidden>
                <ui.Box flex>
                    <InteractiveMap
                        flex
                        cameraProps={getRideCamera(ride)}
                        toolbarBottom={8 + (ride.elevationProfile ? 7 : 0)}
                        aux={
                            ride.isOrganizer &&
                            ride.isEditable && (
                                <ui.Box position='absolute' top right>
                                    <ui.Button
                                        color='light'
                                        borderVariant='round'
                                        StartIcon={icons.Settings}
                                        onPress={onAdditionalClick}
                                    />
                                </ui.Box>
                            )
                        }
                    >
                        {ride.track ? (
                            <MapboxGL.ShapeSource id='trackSource' shape={ride.track}>
                                <MapboxGL.LineLayer
                                    id='track'
                                    style={{ lineColor: colors.primary.background, lineWidth: 3, lineOpacity: 1 }}
                                />
                            </MapboxGL.ShapeSource>
                        ) : ride.start != null && ride.finish != null ? (
                            <MapboxGL.ShapeSource
                                id='trackLine'
                                shape={{
                                    type: 'LineString',
                                    coordinates: [ride.start.location.coordinates, ride.finish.location.coordinates],
                                }}
                            >
                                <MapboxGL.LineLayer
                                    id='track'
                                    style={{
                                        lineColor: colors.primary.background,
                                        lineWidth: 2,
                                        lineOpacity: 0.75,
                                        lineDasharray: [2, 2],
                                    }}
                                />
                            </MapboxGL.ShapeSource>
                        ) : null}
                        <RidePointMarker location={ride.start.location} name='Start' />
                        {ride.finish && <RidePointMarker location={ride.finish.location} name='Finish' />}
                    </InteractiveMap>
                    {ride.elevationProfile && (
                        <ui.Box position='absolute' bottom={0} left={0} right={0}>
                            <ui.FileImage image={ride.elevationProfile} loader={false} />
                            <ui.Box height={64} left={0} right={0} backgroundColor='rgba(255, 111, 90, 0.15)' />
                        </ui.Box>
                    )}
                </ui.Box>
                <ui.Box height={bottomSnapPoint - 64} />
                <BottomSheet ref={bottomSheetRef} {...bottomSheetProps}>
                    <ui.Tabs initialTab={tab} flex lazy>
                        <ui.Tab name='Ride' flex Icon={icons.Rides} onPress={expandBottomSheet}>
                            <ui.BottomSheetScrollView paddingBottom={6}>
                                <ui.Box paddingTop>
                                    <ui.Stack spacing marginBottom={2}>
                                        <ui.Box paddingHorizontal={2}>
                                            <UserMediaCard
                                                user={ride.organizer}
                                                subtitle='Organizer'
                                                aux={
                                                    <ui.Box flex flexCenter>
                                                        <RideActionButtons ride={ride} />
                                                    </ui.Box>
                                                }
                                            />
                                        </ui.Box>
                                        <ui.Divider />
                                        <ui.Box>
                                            <RideMeta
                                                ride={ride}
                                                onRiderLevelClick={onRiderLevelClick}
                                                onBikeTypeClick={onBikeTypeClick}
                                            />
                                        </ui.Box>
                                        <ui.Divider marginBottom />
                                        <RideChips
                                            ride={ride}
                                            hideChat={!ride.isOrganizer && ride.participantStatus !== 'approved'}
                                        />
                                    </ui.Stack>
                                    <ui.Box paddingHorizontal={2}>
                                        <RideStartDateTimeButton
                                            ride={ride}
                                            onChange={onStartDateChange}
                                            onAddEvent={() => {
                                                if (!ride.isEditable) {
                                                    return;
                                                }

                                                return AddCalendarEvent.presentEventCreatingDialog({
                                                    title: `Ride with ${ride.organizer.name}`,
                                                    startDate: ride.startDate,
                                                    endDate: addHours(new Date(ride.startDate), 3).toISOString(),
                                                    url: `https://findmyride.cc/rides/${ride.id}`,
                                                    notes: dedent`Get ready to have fun with Find My Ride

                                                  Organizer: ${ride.organizer.name}
                                                  
                                                  Start Point: ${ride.start.name} (${ride.start.location.coordinates[0]}, ${ride.start.location.coordinates[1]})`,
                                                    location: ride.start.name,
                                                });
                                            }}
                                        />
                                        {ride.startDate && (
                                            <EstimationSelector
                                                onChange={
                                                    onAutoFinishChange && ((autoFinish) => onAutoFinishChange(autoFinish))
                                                }
                                                value={ride.autoFinish}
                                            />
                                        )}
                                        <RidePointButton
                                            value={ride.start}
                                            name='Start'
                                            onChange={onChangeLocation && ((value) => onChangeLocation('start', value))}
                                        />
                                        <RidePointButton
                                            value={ride.finish}
                                            name='Finish'
                                            onChange={onChangeLocation && ((value) => onChangeLocation('finish', value))}
                                        />
                                        <RideDescription title='Title' value={ride.title} onChange={onTitleChange} />
                                        <RideDescription
                                            title='Description'
                                            value={ride.description}
                                            onChange={onDescriptionChange}
                                        />
                                        {ride.isOrganizer && (
                                            <RideChatLink title='Chat Link' value={ride.chatLink} onChange={onChatLinkChange} />
                                        )}

                                        {ride.isOrganizer && (
                                            <RideChatLink
                                                title='Terms and Conditions URL'
                                                value={ride.termsUrl}
                                                onChange={onTermsUrlChange}
                                            />
                                        )}
                                    </ui.Box>
                                </ui.Box>
                                {ride.isOrganizer && ride.isEditable && (
                                    <ui.Box paddingBottom={6} paddingTop={4}>
                                        <ui.Box paddingHorizontal={2}>
                                            <CancelButton ride={ride} />
                                        </ui.Box>
                                    </ui.Box>
                                )}
                            </ui.BottomSheetScrollView>
                        </ui.Tab>
                        <ui.Tab name='participants' flex Icon={icons.Users} onPress={expandBottomSheet}>
                            <ParticipatesList ride={ride} />
                        </ui.Tab>
                        <ui.Tab name='images' flex Icon={icons.Image} onPress={expandBottomSheet}>
                            <ui.BottomSheetScrollView paddingBottom={`${bottom}px`}>
                                <RideImageGallery ride={ride} />
                            </ui.BottomSheetScrollView>
                        </ui.Tab>
                        {ride.isOrganizer || ride.participantStatus === 'approved' ? (
                            <ui.Tab
                                name='chat'
                                customTitle={() => <ChatButton roomId={ride.id} />}
                                onPress={() => openChat(ride.id)}
                            />
                        ) : null}
                    </ui.Tabs>
                </BottomSheet>
            </ui.Box>
        </ui.Screen>
    );
});

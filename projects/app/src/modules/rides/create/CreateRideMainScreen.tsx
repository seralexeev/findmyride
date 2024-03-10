import BottomSheet from '@gorhom/bottom-sheet';
import MapboxGL from '@rnmapbox/maps';
import React, { FC, useEffect } from 'react';
import { useRpc } from '../../../api/rpc';
import { icons, ui } from '../../../ui';
import { useScreen } from '../../../ui/ScreenProvider';
import { useTheme } from '../../../ui/ThemeProvider';
import { useBottomSheetHelper } from '../../../ui/components';
import { FillSplashLoader } from '../../common/SplashLoader';
import { InteractiveMap } from '../../map/InteractiveMap';
import { useProfile } from '../../user/ProfileProvider';
import { UserMediaCard } from '../../user/UserMediaCard';
import { RideChatLink, RideDescription } from '../RideDescription';
import { RideMeta } from '../RideMeta';
import { RidePointButton } from '../RidePointButton';
import { RidePointMarker } from '../RidePointMarker';
import { RideStartDateTimeButton } from '../RideStartDateTimeButton';
import { BikeTypeSelector } from './BikeTypeSelector';
import { RideAdditionalOptionsScreen } from './CreateRideAdditionalOptionsScreen';
import { CreateRideSubmitButton } from './CreateRideSubmitButton';
import { EstimationSelector } from './EstimationSelector';
import { RideChips } from './RideChips';
import { RiderLevelSelector } from './RideLevelSelector';
import { useCreateRide, useRidePoint } from './services';
import { getRideCamera } from './utils';

const bottomSnapPoint = 450;
const snapPoints = [bottomSnapPoint, '100%'];
export const CreateRideMainScreen: FC = () => {
    const { showScreen } = useScreen();
    const { ride, setRide, loading } = useCreateRide();
    const { colors } = useTheme();
    const { profile } = useProfile();
    const [bottomSheetRef, bottomSheetProps] = useBottomSheetHelper(snapPoints, { withRounds: true });
    const setLocation = useRidePoint();

    const distanceToStartQuery = useRpc('geo/distance_to_user').useQuery({
        input: { target: ride.start?.location! },
        enabled: Boolean(ride.start?.location),
    });

    useEffect(() => {
        const distanceToStart = distanceToStartQuery.data?.distance;
        if (distanceToStart != null) {
            setRide((prev) => ({ ...prev, distanceToStart }));
        }
    }, [distanceToStartQuery.data?.distance]);

    const distanceQuery = useRpc('geo/distance').useQuery({
        input: { from: ride.start?.location!, to: ride.finish?.location! },
        enabled: Boolean(ride.start?.location && ride.finish?.location && !ride.gpxTrackId),
    });

    useEffect(() => {
        const calculatedDistance = distanceQuery.data?.distance;
        if (calculatedDistance != null) {
            setRide((prev) => ({ ...prev, calculatedDistance }));
        }
    }, [distanceQuery.data?.distance]);

    const showAdditionalOption = () => {
        return showScreen({
            children: (
                <RideAdditionalOptionsScreen value={ride} onChange={(value) => setRide((prev) => ({ ...prev, ...value }))} />
            ),
        });
    };

    const onRiderLevelClick = () => {
        showScreen({
            children: (
                <RiderLevelSelector.Screen
                    value={ride.riderLevel}
                    onChange={(riderLevel) => setRide((prev) => ({ ...prev, riderLevel }))}
                />
            ),
        });
    };

    const onBikeTypeClick = () => {
        showScreen({
            children: (
                <BikeTypeSelector.Screen
                    value={ride.bikeType}
                    onChange={(bikeType) => setRide((prev) => ({ ...prev, bikeType }))}
                />
            ),
        });
    };

    return (
        <ui.Screen name='CreateRideMainScreen' header='New Ride' white bottomSafeArea={false}>
            <InteractiveMap
                flex
                cameraProps={getRideCamera(ride)}
                toolbarBottom={8}
                aux={
                    <ui.Box position='absolute' top right>
                        <ui.Button
                            shadow
                            color='light'
                            borderVariant='round'
                            StartIcon={icons.Settings}
                            onPress={showAdditionalOption}
                        />
                    </ui.Box>
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

                <RidePointMarker name='Start' location={ride.start?.location} />
                <RidePointMarker name='Finish' location={ride.finish?.location} />
            </InteractiveMap>
            <ui.Box height={bottomSnapPoint - 64} />
            <BottomSheet ref={bottomSheetRef} {...bottomSheetProps}>
                <ui.BottomSheetScrollView>
                    <ui.Stack spacing>
                        <ui.Box paddingHorizontal>
                            <UserMediaCard
                                user={profile}
                                subtitle='Organizer'
                                aux={
                                    <ui.Box flex flexCenter>
                                        <CreateRideSubmitButton />
                                    </ui.Box>
                                }
                            />
                        </ui.Box>
                        <ui.Divider />
                        <RideMeta
                            ride={ride}
                            loading={{
                                distanceToStart: distanceToStartQuery.isFetching,
                                calculatedDistance: distanceQuery.isFetching,
                            }}
                            onRiderLevelClick={onRiderLevelClick}
                            onBikeTypeClick={onBikeTypeClick}
                        />
                        <ui.Divider marginBottom />
                        <RideChips ride={ride} />
                    </ui.Stack>
                    <ui.Stack paddingHorizontal={2}>
                        <RideStartDateTimeButton
                            ride={ride}
                            onChange={(startDate) => setRide((prev) => ({ ...prev, startDate }))}
                        />
                        {ride.startDate && (
                            <EstimationSelector
                                onChange={(autoFinish) => setRide((prev) => ({ ...prev, autoFinish }))}
                                value={ride.autoFinish}
                            />
                        )}
                        <RidePointButton
                            name='Start'
                            value={ride.start}
                            onChange={(value) => setLocation('start', value)}
                            required
                        />
                        {ride.start && (
                            <RidePointButton
                                name='Finish'
                                value={ride.finish}
                                onChange={(value) => setLocation('finish', value)}
                            />
                        )}
                        <RideDescription
                            title='Title'
                            value={ride.title}
                            onChange={(title) => setRide((prev) => ({ ...prev, title }))}
                        />
                        <RideDescription
                            title='Description'
                            value={ride.description}
                            onChange={(description) => setRide((prev) => ({ ...prev, description }))}
                        />
                        <RideChatLink
                            title='Chat Link'
                            value={ride.chatLink}
                            onChange={(chatLink) => setRide((prev) => ({ ...prev, chatLink }))}
                        />
                        <RideChatLink
                            title='Terms and Conditions URL'
                            value={ride.termsUrl}
                            onChange={(termsUrl) => setRide((prev) => ({ ...prev, termsUrl }))}
                        />
                    </ui.Stack>
                </ui.BottomSheetScrollView>
            </BottomSheet>
            <FillSplashLoader visible={loading} />
        </ui.Screen>
    );
};

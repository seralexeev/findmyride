import { Colors, RpcItemsOutput } from '@findmyride/api';
import { keepPreviousData } from '@tanstack/react-query';
import { Position } from '@untype/geo';
import React, { VFC, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Carousel from 'react-native-snap-carousel';
import { useDebounce } from 'use-debounce';
import { useRpc } from '../../api/rpc';
import { icons, ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { useProfile } from '../user/ProfileProvider';
import { UserAvatar } from '../user/UserAvatar';
import { UserMediaCard } from '../user/UserMediaCard';
import { FilteredRidesScreen } from './FilteredRidesScreen';
import { RideCard } from './RideCard';
import { RiderLevelIcon } from './RiderLevelIcon';
import { RideFilterProps } from './filter/RideFilter';

type RideVm = RpcItemsOutput<'ride/find'>;

export const RidesMap: VFC<RideFilterProps> = ({ filter }) => {
    const [bbox, setBbox] = useState<[Position, Position]>();
    const { bottom } = useSafeAreaInsets();
    const map = useRef<MapboxGL.MapView>(null);
    const { showScreen } = useScreen();
    const { width } = useWindowDimensions();
    const { profile } = useProfile();
    const [selected, setSelected] = useState<RideVm | null>(null);
    const [debounced] = useDebounce(selected, 100, { leading: false });
    const valueOrDebounced = selected || debounced;
    const ridesQuery = useRpc('ride/find').useQuery({
        placeholderData: keepPreviousData,
        input: { filter: { ...filter, bbox }, page: 1 },
    });

    const camera = useRef<MapboxGL.Camera>(null);

    const rides = ridesQuery.data?.items ?? [];
    const clusters = ridesQuery.data?.clusters ?? [];

    useEffect(() => {
        if (selected && ridesQuery.data?.items) {
            if (ridesQuery.data?.items.every((x) => x.id !== selected.id)) {
                setSelected(null);
            }
        }
    }, [ridesQuery.data?.items, selected]);

    useEffect(() => {
        void map.current?.getVisibleBounds().then((bbox) => setBbox(bbox as [Position, Position]));
    }, []);

    const centerCoordinate = profile.location?.location.coordinates;
    const cameraProps: CameraProps = centerCoordinate
        ? { zoomLevel: 12, animationDuration: 0, centerCoordinate }
        : { centerCoordinate: [2.1732330322265625, 41.39071867007324], zoomLevel: 3, animationDuration: 1000 };

    return (
        <ui.Box flex position='relative' paddingBottom={`${bottom}px`}>
            <InteractiveMap
                ref={map}
                flex
                askPermission
                toolbarBottom={8}
                onRegionDidChange={(x) => {
                    if (x.properties.isUserInteraction) {
                        setBbox(x.properties.visibleBounds as [Position, Position]);
                    }
                }}
                onPress={() => setSelected(null)}
            >
                {rides.map((x, i) => {
                    const isSelected = x.id === selected?.id;
                    const size = isSelected ? 48 : 36;

                    return (
                        <MapboxGL.MarkerView
                            key={`${x.id}-${i}`}
                            coordinate={x.location.coordinates}
                            id={`ride-${x.id}`}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <ui.Box onPress={() => setSelected((prev) => (prev === x ? null : x))} haptic wh={size}>
                                <ui.Transition inAnimation='fadeInDown' visible delay={i * 50} duration={100}>
                                    <icons.Marker
                                        width={size}
                                        height={size}
                                        fill={x.type === 'ride' ? '#e74c3c' : Colors.black}
                                    />
                                    <ui.Box absolute alignItems='center' fillContainer paddingTop={`${size / 8 - 2}px`}>
                                        <UserAvatar user={x.type === 'ride' ? x.ride.organizer : x.user} size={size / 2} />
                                    </ui.Box>
                                </ui.Transition>
                            </ui.Box>
                        </MapboxGL.MarkerView>
                    );
                })}

                {clusters.map((x, i) => {
                    return (
                        <MapboxGL.MarkerView
                            key={i}
                            coordinate={x.center.coordinates}
                            id={`cluster-${i}`}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <ui.Box
                                wh={32}
                                onPress={() => {
                                    const { bbox } = x;
                                    if (bbox) {
                                        setBbox([bbox.ne, bbox.sw]);
                                        camera.current?.fitBounds(bbox.ne, bbox.sw, 64, 300);
                                    } else {
                                        showScreen({
                                            screen: (
                                                <FilteredRidesScreen
                                                    title='Rides'
                                                    filter={{
                                                        ...filter,
                                                        bbox: [x.center.coordinates, x.center.coordinates],
                                                        allowClusters: false,
                                                    }}
                                                />
                                            ),
                                        });
                                    }
                                }}
                                haptic
                            >
                                <ui.Transition
                                    flexCenter
                                    inAnimation='zoomIn'
                                    visible
                                    delay={i * 50}
                                    duration={100}
                                    round
                                    bgPalette='primary'
                                    flex
                                >
                                    <ui.Box haptic flexCenter>
                                        <ui.Text
                                            children={x.count}
                                            color='#fff'
                                            fontSize={10}
                                            marginTop='2px'
                                            variant='body2'
                                        />
                                    </ui.Box>
                                </ui.Transition>
                            </ui.Box>
                        </MapboxGL.MarkerView>
                    );
                })}
                <MapboxGL.Camera ref={camera} {...cameraProps} />
            </InteractiveMap>
            <ui.Transition
                shadow
                position='absolute'
                top
                left={0}
                right={0}
                visible={Boolean(selected)}
                inAnimation='fadeInDown'
                outAnimation='fadeOutUp'
                duration={100}
            >
                {valueOrDebounced && (
                    <Carousel
                        data={rides}
                        firstItem={rides.findIndex((x) => x.id === selected?.id)}
                        renderItem={({ item }) =>
                            item.type === 'user' ? (
                                <ui.Box height={128}>
                                    <ui.Box borderRadius backgroundColor='#fff' borderColor borderWidth overflowHidden padding>
                                        <UserMediaCard
                                            user={item.user}
                                            navigateByName
                                            aux={
                                                <ui.Box flexCenter paddingTop paddingRight>
                                                    <RiderLevelIcon level={item.user.level} size={12} />
                                                    <ui.Text variant='caption' marginTop='5px' children='Level' />
                                                </ui.Box>
                                            }
                                        />
                                    </ui.Box>
                                </ui.Box>
                            ) : (
                                <RideCard ride={item.ride} compact />
                            )
                        }
                        sliderWidth={width}
                        itemWidth={width - 16}
                        onSnapToItem={(index) => setSelected(rides[index] ?? null)}
                    />
                )}
            </ui.Transition>
            {ridesQuery.isRefetching && (
                <ui.Box position='absolute' bottom={12} left>
                    <ui.Spinner wh={16} />
                </ui.Box>
            )}
        </ui.Box>
    );
};

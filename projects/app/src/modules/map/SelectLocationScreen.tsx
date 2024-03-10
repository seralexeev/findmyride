import { RpcInput, RpcOutput } from '@findmyride/api';
import BottomSheet from '@gorhom/bottom-sheet';
import MapboxGL from '@rnmapbox/maps';
import { RegionPayload } from '@rnmapbox/maps/lib/typescript/src/components/MapView';
import { keepPreviousData } from '@tanstack/react-query';
import { LocationWithName, Position } from '@untype/geo';
import React, { FC, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useDebounce } from 'use-debounce';
import { useRemoveQuery, useRpc } from '../../api/rpc';
import { useBooleanState } from '../../hooks/useBooleanState';
import { icons, ui } from '../../ui';
import { useBottomSheetHelper } from '../../ui/components';
import { InteractiveMap } from './InteractiveMap';

type GeoCodeOutput = RpcOutput<'geo/geocode'>['items'][number];

export type SelectLocationScreenProps = {
    value?: LocationWithName | null;
    types?: RpcInput<'geo/geocode'>['types'];
    onSelect: (value: LocationWithName) => Promise<any> | void;
    askPermission?: boolean;
    askPermissionForce?: boolean;
    aux?: ReactNode;
};

export const SelectLocationScreen: FC<SelectLocationScreenProps> = (props) => {
    const [selected, setSelected] = useState<LocationWithName | null>(null);

    const onSave = () => {
        if (selected && props.onSelect) {
            return props.onSelect(selected);
        }
    };

    return (
        <ui.Screen
            name='SelectLocationScreen'
            header='Select Location'
            bottomSafeArea={false}
            headerRight={
                <ui.Button
                    haptic
                    disabled={!selected}
                    onPress={onSave}
                    borderVariant='round'
                    color='primary'
                    children='Save'
                    size='small'
                />
            }
        >
            <SelectLocationView {...props} onSelect={setSelected} />
        </ui.Screen>
    );
};

export type SelectLocationViewProps = {
    value?: LocationWithName | null;
    types?: RpcInput<'geo/geocode'>['types'];
    onSelect: (value: LocationWithName | null) => void;
    askPermission?: boolean;
    askPermissionForce?: boolean;
    aux?: ReactNode;
};

const bottomSnapPoint = 300;
const snapPoints = [bottomSnapPoint, '100%'];
export const SelectLocationView: FC<SelectLocationViewProps> = ({
    onSelect,
    types,
    value,
    askPermission,
    askPermissionForce,
    aux,
}) => {
    const removeQuery = useRemoveQuery();
    const geocodeRpc = useRpc('geo/geocode');
    const [reverseGeocode, { isLoading }] = geocodeRpc.useMutation();
    const [input, setInput] = useState(value?.name ?? '');
    const [inputFocused, onFocus, onBlur] = useBooleanState();
    const camera = useRef<MapboxGL.Camera>(null);
    const [debouncedInput, { flush }] = useDebounce(input, 500, { leading: true });
    const map = useRef<MapboxGL.MapView>(null);
    const [bottomSheetRef, bottomSheetProps] = useBottomSheetHelper(snapPoints, {
        withRounds: true,
        onChange: (index) => {
            if (index === 0) {
                onBlur();
            }
        },
    });

    const geocodeQuery = geocodeRpc.useQuery({
        input: { input: debouncedInput, types },
        enabled: Boolean(debouncedInput),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (value) {
            setInputAndState(value, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const setInputAndState = (value: LocationWithName, moveCamera: boolean) => {
        if (moveCamera) {
            setTimeout(() => {
                camera.current?.setCamera({
                    centerCoordinate: value.location.coordinates,
                    animationMode: 'flyTo',
                    animationDuration: 300,
                    zoomLevel: 12,
                });
            }, 100);
        }

        setInput(value.name);
        onSelect(value);
    };

    const onRegionDidChange = ({ geometry, properties }: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) => {
        if (!properties.isUserInteraction) {
            return;
        }

        return onRegionUpdate(geometry.coordinates as Position);
    };

    const onRegionUpdate = async (coordinates: Position) => {
        await removeQuery(['geo/geocode']);
        onSelect(null);

        return reverseGeocode({ input: coordinates, types }).then((x) => {
            const value = x.items[0];
            if (value) {
                setInputAndState({ name: value.name, location: value.center }, false);
                flush();
            }
        });
    };

    const onSelectItem = (value: GeoCodeOutput) => {
        bottomSheetRef.current?.snapToIndex(0);
        setInputAndState({ name: value.fullAddress, location: value.center }, true);
        onBlur();
    };

    const items = geocodeQuery.isSuccess && Boolean(input) ? geocodeQuery.data.items : [];
    const isBusy = geocodeQuery.isFetching || isLoading;

    const centerCoordinate = value?.location.coordinates;

    useEffect(() => {
        if (inputFocused) {
            bottomSheetRef.current?.expand();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputFocused]);

    return (
        <Fragment>
            <ui.Box flex flexCenter>
                <InteractiveMap
                    ref={map}
                    askPermission={askPermission}
                    askPermissionForce={askPermissionForce}
                    overflowHidden
                    fillContainer
                    onRegionDidChange={onRegionDidChange}
                    onPress={onBlur}
                    toolbarBottom={8}
                    cameraProps={centerCoordinate ? { zoomLevel: 12, animationDuration: 0, centerCoordinate } : null}
                    aux={aux}
                    onDidFinishLoadingMap={() => {
                        if (!value) {
                            void map.current?.getCenter().then((x) => onRegionUpdate(x as Position));
                        }
                    }}
                >
                    <MapboxGL.Camera ref={camera} />
                </InteractiveMap>
                <ui.Box position='absolute'>
                    <ui.Box marginBottom='40px'>
                        <icons.Marker width={32} height={32} />
                    </ui.Box>
                </ui.Box>
            </ui.Box>

            <ui.Box height={bottomSnapPoint - 64} />
            <BottomSheet ref={bottomSheetRef} {...bottomSheetProps}>
                <ui.Box paddingHorizontal marginBottom>
                    <ui.Input
                        StartIcon={icons.Location}
                        value={input}
                        onChangeText={setInput}
                        color='tertiary'
                        onFocus={onFocus}
                        onBlur={onBlur}
                        focused={inputFocused}
                        loading={isBusy}
                    />
                </ui.Box>

                <ui.BottomSheetScrollView keyboardShouldPersistTaps='always'>
                    <KeyboardAvoidingView behavior='padding'>
                        <ui.Stack spacing padding>
                            {items.map((x, i, ar) => (
                                <ui.Pressable key={x.id} haptic onPress={() => onSelectItem(x)} row alignItems='center'>
                                    <ui.Box marginBottom>
                                        <icons.Marker width={24} height={24} fill='#DBDADB' />
                                    </ui.Box>
                                    <ui.Box marginLeft flex>
                                        <ui.Box row alignItems='center' justifyContent='space-between'>
                                            <ui.Box flex>
                                                <ui.Text marginBottom={0.5} children={x.name} />
                                                <ui.Text variant='caption' children={x.fullAddress} />
                                            </ui.Box>
                                            <ui.Box marginLeft>
                                                <icons.ArrowLeftUp width={24} height={24} stroke='#DBDADB' />
                                            </ui.Box>
                                        </ui.Box>

                                        {i < ar.length - 1 && <ui.Divider marginTop />}
                                    </ui.Box>
                                </ui.Pressable>
                            ))}
                        </ui.Stack>
                    </KeyboardAvoidingView>
                </ui.BottomSheetScrollView>
            </BottomSheet>
        </Fragment>
    );
};

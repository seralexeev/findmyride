import { TrackSource } from '@findmyride/api';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import React, { FC, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { icons, ui } from '../../../ui';
import { useScreen } from '../../../ui/ScreenProvider';
import { useProfile } from '../../user/ProfileProvider';
import { CreateRideMainScreen } from './CreateRideMainScreen';
import {
    CreateRideProvider,
    CreateRideVm,
    createEmptyCreateRideModel,
    useCreateFromStravaRoute,
    useGpxUpload,
    useManualSource,
    useUrlParseSource,
} from './services';
import { TrackSourceConfig, getTrackSourceConfig } from './utils';

const tryGetSourceFromUrl = (value: unknown): TrackSource | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const url = new URL(value);
    try {
        switch (true) {
            case url.host.includes('ridewithgps'):
                return 'rwg';
            case url.host.includes('komoot'):
                return 'komoot';
            default:
                return null;
        }
    } catch (e) {
        return null;
    }
};

export const SelectRideSourceScreen: FC = () => {
    const [selected, setSelected] = useState<TrackSource | null>(null);
    const [clipboard, setClipboard] = useState<{ config: TrackSourceConfig; url: string } | null>(null);
    const parseSourceUrl = useUrlParseSource();
    const { goBack } = useNavigation();
    const { showScreen } = useScreen();
    const { profile } = useProfile();

    const readValueFromClipboard = () => {
        return Clipboard.getString().then((url) => {
            const parsed = tryGetSourceFromUrl(url);
            setClipboard(parsed ? { config: getTrackSourceConfig(parsed), url } : null);
        });
    };

    useEffect(() => {
        const { remove } = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                return readValueFromClipboard();
            }
        });

        void readValueFromClipboard();

        return remove;
    }, []);

    const providers: Record<TrackSource, () => Promise<Partial<CreateRideVm>> | Partial<CreateRideVm>> = {
        manual: useManualSource(),
        gpx: useGpxUpload(),
        strava: useCreateFromStravaRoute(),
        komoot: () => parseSourceUrl('komoot'),
        rwg: () => parseSourceUrl('rwg'),
    };

    const onPress = (type: TrackSource, handler: () => Promise<Partial<CreateRideVm>> | Partial<CreateRideVm>) => {
        return async () => {
            setSelected(type);
            try {
                const payload = await handler();
                const model = createEmptyCreateRideModel({
                    riderLevel: profile.level,
                    bikeType: profile.bikeType[0],
                    ...payload,
                });
                goBack();
                showScreen({
                    children: (
                        <CreateRideProvider model={model}>
                            <CreateRideMainScreen />
                        </CreateRideProvider>
                    ),
                });
            } catch (e) {
                console.error(e);
            } finally {
                setSelected(null);
            }
        };
    };

    return (
        <ui.Screen name='SelectRideSourceScreen' padding backgroundColor='#fff' topSafeArea={false}>
            <ui.Box flexCenter row justifyContent='space-between'>
                <ui.Box flex />
                <ui.Text variant='title2' children='New Ride' padding={2} flex center />
                <ui.Box flex alignItems='flex-end' paddingRight={2} onPress={goBack}>
                    <ui.Button borderVariant='round' StartIcon={icons.Cross} size='small' color='tertiary' />
                </ui.Box>
            </ui.Box>
            <ui.Box padding={2} flex>
                <ui.Box flexCenter flex>
                    <ui.LottieBox
                        source={require('../../../ui/lottie/area-map.json')}
                        autoPlay
                        loop={Boolean(selected)}
                        wh={196}
                    />
                </ui.Box>

                <ui.Text marginBottom variant='caption'>
                    Select one of the following options to create a route:
                </ui.Text>

                <ui.Stack spacing fullWidth>
                    {Object.entries(providers).map(([type, handler], i) => {
                        const config = getTrackSourceConfig(type as TrackSource);

                        return (
                            <ui.Transition key={type} inAnimation='fadeInRight' delay={i * 50} duration={300}>
                                <ui.Button
                                    StartIcon={config.Icon}
                                    onPress={onPress(config.type, handler)}
                                    size='large'
                                    borderVariant='round'
                                    color='tertiary'
                                    alignItems='flex-start'
                                    haptic
                                    disabled={selected ? selected !== config.type : false}
                                    fillIcon={config.fillIcon}
                                    children={config.title}
                                />
                            </ui.Transition>
                        );
                    })}
                    {clipboard && (
                        <ui.Transition inAnimation='fadeInRight' delay={500} duration={300}>
                            <ui.Divider children='Found in your Clipboard' marginBottom={2} marginTop={1} />
                            <ui.Button
                                StartIcon={icons.Copy}
                                onPress={onPress(clipboard.config.type, () =>
                                    parseSourceUrl(clipboard.config.type, clipboard.url),
                                )}
                                size='large'
                                borderVariant='round'
                                color='primary'
                                alignItems='flex-start'
                                haptic
                                disabled={selected ? selected !== clipboard.config.type : false}
                                fillIcon={false}
                                children={`${clipboard.config.name} from the Clipboard`}
                            />
                        </ui.Transition>
                    )}
                </ui.Stack>
            </ui.Box>
        </ui.Screen>
    );
};

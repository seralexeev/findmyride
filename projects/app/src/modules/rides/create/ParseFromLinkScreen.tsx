import { RpcOutput, SelectRpcEndpoint, TrackSource } from '@findmyride/api';
import { useNavigation } from '@react-navigation/native';
import React, { FC, memo, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRpc } from '../../../api/rpc';
import { useLoadCallback } from '../../../hooks/useLoadingCallback';
import { ui } from '../../../ui';
import { FillSplashLoader } from '../../common/SplashLoader';
import { getTrackSourceConfig } from './utils';

type ParseFromLinkScreenProps = {
    trackSource: TrackSource;
    logoSize?: number;
    onSuccess: (url: string, trackSource: TrackSource, value: RpcOutput<'geo/upload_gpx'>) => void;
    endpoint: SelectRpcEndpoint<'rwg/parse' | 'komoot/parse'>;
    prefilledUrl?: string;
};

export const ParseFromLinkScreen: FC<ParseFromLinkScreenProps> = memo(
    ({ logoSize = 128, onSuccess, endpoint, trackSource, prefilledUrl }) => {
        const config = getTrackSourceConfig(trackSource);
        const [url, setUrl] = useState(prefilledUrl ?? '');
        const [mutateAsync] = useRpc(endpoint).useMutation();
        const { goBack } = useNavigation();

        const [onPress, loading] = useLoadCallback(() => {
            Keyboard.dismiss();

            return mutateAsync({ url }).then((x) => {
                onSuccess(url, trackSource, x);
                goBack();
            });
        });

        useEffect(() => {
            if (prefilledUrl) {
                void onPress();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [prefilledUrl]);

        return (
            <ui.Screen
                name='ParseFromLinkScreen'
                header={config.name}
                bottomSafeArea={false}
                headerRight={
                    !loading && (
                        <ui.Button
                            disabled={!url}
                            onPress={onPress}
                            borderVariant='round'
                            color='primary'
                            children='Import'
                            size='small'
                        />
                    )
                }
            >
                <ui.Box flex padding>
                    <ui.Box flexCenter padding>
                        <config.Icon width={logoSize} height={logoSize} />
                    </ui.Box>
                    <ui.Text variant='caption' marginBottom>
                        {config.title}
                    </ui.Text>
                    <ui.Input
                        color='light'
                        value={url}
                        onChangeText={setUrl}
                        autoFocus={!prefilledUrl}
                        disabled={loading}
                        placeholder={config.linkExample}
                    />
                </ui.Box>
                <FillSplashLoader visible={loading} label='Importing your route...' />
            </ui.Screen>
        );
    },
);

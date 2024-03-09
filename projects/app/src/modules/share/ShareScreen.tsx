import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { TransitionPresets } from '@react-navigation/stack';
import React, { FC, memo } from 'react';
import { Linking, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Share, { Social } from 'react-native-share';
import { useEvent } from '../../hooks/useEvent';
import { icons, ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';

type ShareScreenProps = {
    title: string;
    url?: string;
    message?: string;
};

export const ShareScreen: FC<ShareScreenProps> = memo(({ title, url, message }) => {
    const { goBack } = useNavigation();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const shareInstagramStories = () => {
        return Share.shareSingle({
            // backgroundImage: 'http://urlto.png',
            backgroundBottomColor: '#fefefe',
            backgroundTopColor: '#906df4',
            attributionURL: url,
            social: Social.InstagramStories,
            // TODO: fixme
            appId: '...', //facebook appId
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const shareFacebook = () => {
        return Share.shareSingle({
            // TODO: fixme
            social: Social.Facebook,
        });
    };

    return (
        <ui.Screen name='ShareScreen' padding backgroundColor='#fff' topSafeArea={false}>
            <ui.Box flexCenter row justifyContent='space-between'>
                <ui.Box flex />
                <ui.Text variant='title2' children={title} padding={2} flex center />
                <ui.Box flex alignItems='flex-end' paddingRight={2} onPress={goBack}>
                    <ui.Button borderVariant='round' StartIcon={icons.Cross} size='small' color='tertiary' />
                </ui.Box>
            </ui.Box>
            <ui.Box padding={2} flex>
                {url ? (
                    <ui.Box>
                        <ui.Box flexCenter marginTop={4} marginBottom={8}>
                            <QRCode value={url} size={128} logoBackgroundColor='transparent' />
                        </ui.Box>
                        <ui.Pressable onPress={() => Linking.openURL(url)}>
                            <ui.Text children={url} color='#06c' selectable center />
                        </ui.Pressable>
                    </ui.Box>
                ) : null}
                <ui.Box flex />
                <ui.Stack spacing marginTop={4}>
                    {/* <ui.Button
                        StartIcon={icons.FacebookLogo}
                        onPress={shareFacebook}
                        size='large'
                        borderVariant='round'
                        color='tertiary'
                        alignItems='flex-start'
                        haptic
                        children='Share on Facebook'
                    />
                    <ui.Button
                        StartIcon={icons.Instagram}
                        onPress={shareInstagramStories}
                        size='large'
                        borderVariant='round'
                        color='tertiary'
                        alignItems='flex-start'
                        haptic
                        children='Share on Instagram'
                    /> */}
                    {url ? (
                        <ui.Button
                            StartIcon={icons.Link}
                            onPress={() => Clipboard.setString(url)}
                            size='large'
                            borderVariant='round'
                            color='tertiary'
                            alignItems='flex-start'
                            haptic
                            children='Copy the Link'
                        />
                    ) : null}
                    <ui.Divider marginVertical children='or' />
                    <ui.Button
                        StartIcon={icons.Share}
                        onPress={() => Share.open({ title, message, url, showAppsToView: true })}
                        size='large'
                        borderVariant='round'
                        color='tertiary'
                        alignItems='flex-start'
                        haptic
                        children='Share'
                    />
                </ui.Stack>
            </ui.Box>
        </ui.Screen>
    );
});

export const useShareScreen = () => {
    const { showScreen } = useScreen();

    return useEvent((props: ShareScreenProps) => {
        showScreen({
            children: <ShareScreen {...props} />,
            options: Platform.select({
                ios: TransitionPresets.ModalPresentationIOS,
                android: TransitionPresets.RevealFromBottomAndroid,
            }),
        });
    });
};

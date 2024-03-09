import React, { FC } from 'react';
import { Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useConfig } from '../../config/ConfigProvider';
import { icons, ui } from '../../ui';
import { DevScreenHiddenAction } from '../common/DevScreen';

export const HelpScreen: FC = () => {
    const config = useConfig();

    return (
        <ui.Screen name='HelpScreen' header='Help' white bottomSafeArea={false}>
            {/* <ui.Box flex flexCenter>
                <ui.Transition flexCenter inAnimation='fadeIn' flex>
                    <ui.Image source={require('../../ui/assets/logo.png')} wh={196} round overflowHidden />
                    <ui.Text variant='title1' marginTop={3}>
                        Find My Ride
                    </ui.Text>
                </ui.Transition>
            </ui.Box> */}

            <ui.Box backgroundColor flex padding paddingBottom={6}>
                <ui.Box flex flexCenter>
                    <ui.Button
                        color='light'
                        size='large'
                        StartIcon={icons.Messenger}
                        onPress={() => Linking.openURL('https://t.me/+yVCzHstLItxkYmQy')}
                        children='Help us Improve the App'
                        marginTop={1}
                        marginBottom={2}
                        borderVariant='round'
                    />
                </ui.Box>

                <ui.Stack spacing>
                    <ui.Button
                        color='light'
                        onPress={() => InAppBrowser.open(config.links.privacyPolicy)}
                        children='Privacy Policy'
                    />
                    <ui.Button
                        color='light'
                        onPress={() => InAppBrowser.open(config.links.termsOfService)}
                        children='Terms of Service'
                    />
                    <DevScreenHiddenAction>
                        <ui.Text marginTop={4} variant='caption' center children={`Version ${DeviceInfo.getVersion()}`} />
                    </DevScreenHiddenAction>
                </ui.Stack>
            </ui.Box>
        </ui.Screen>
    );
};

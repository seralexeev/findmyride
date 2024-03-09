import React, { FC, Fragment, ReactNode } from 'react';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useConfig } from '../../config/ConfigProvider';
import { ui } from '../../ui';
import { DevScreenHiddenAction } from '../common/DevScreen';
import { AuthButtons } from './AuthButtons';

type AuthScreenProps = {
    extra?: ReactNode;
    onSuccess?: () => void;
};

export const AuthView: FC<AuthScreenProps> = ({ extra, onSuccess }) => {
    const config = useConfig();

    return (
        <Fragment>
            <ui.Box flex flexCenter>
                <ui.Transition flexCenter inAnimation='fadeIn' flex>
                    <ui.Image source={require('../../ui/assets/logo.png')} wh={196} round overflowHidden />
                    <DevScreenHiddenAction>
                        <ui.Text variant='title1' marginTop={3} children='Find My Ride' />
                    </DevScreenHiddenAction>
                </ui.Transition>

                <ui.Box fullWidth paddingHorizontal paddingVertical={2}>
                    <AuthButtons onSuccess={onSuccess} />
                    {extra}
                </ui.Box>
            </ui.Box>

            <ui.Box flexCenter>
                <ui.Text variant='caption'>By logging in, you agree to the</ui.Text>
                <ui.Stack row spacing='3px' alignItems='center'>
                    <ui.Pressable onPress={() => InAppBrowser.open(config.links.privacyPolicy)}>
                        <ui.Text variant='caption' underline marginLeft='3px' bold>
                            privacy policy
                        </ui.Text>
                    </ui.Pressable>
                    <ui.Text variant='caption'>and</ui.Text>
                    <ui.Pressable onPress={() => InAppBrowser.open(config.links.termsOfService)}>
                        <ui.Text variant='caption' underline marginLeft='3px' bold>
                            terms of service
                        </ui.Text>
                    </ui.Pressable>
                </ui.Stack>
            </ui.Box>
        </Fragment>
    );
};

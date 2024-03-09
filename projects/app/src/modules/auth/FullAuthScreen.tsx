import React, { FC } from 'react';
import { ui } from '../../ui';
import { AuthView } from './AuthView';
import { useAnonymousLogin } from './services';

export const FullAuthScreen: FC = () => {
    const anonymousLogin = useAnonymousLogin();

    return (
        <ui.Screen padding backgroundColor='#fff' name='FullAuthScreen'>
            <AuthView
                extra={
                    <ui.Transition inAnimation='fadeIn' delay={1000} duration={300}>
                        <ui.Divider children='or' marginVertical={3} paddingHorizontal={2} />
                        <ui.Button onPress={anonymousLogin} size='large' borderVariant='round' haptic children='Skip' />
                    </ui.Transition>
                }
            />
        </ui.Screen>
    );
};

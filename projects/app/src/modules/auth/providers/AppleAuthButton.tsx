import { appleAuth } from '@invertase/react-native-apple-authentication';
import React, { FC, memo } from 'react';
import { icons, ui } from '../../../ui';
import { AuthButtonOuterProps } from '../AuthButton';
import { useLogin } from '../services';

export const AppleAuthButton: FC<AuthButtonOuterProps> = memo(({ onSuccess }) => {
    const login = useLogin();

    if (!appleAuth.isSupported) {
        return null;
    }

    const onLogin = async () => {
        const payload = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });

        if (!payload.authorizationCode) {
            throw new Error('Unable to obtain AuthorizationCode');
        }

        return login({ provider: 'apple', payload: payload as any }).then(onSuccess);
    };

    return (
        <ui.Button
            StartIcon={icons.AppleLogo}
            onPress={onLogin}
            size='large'
            borderVariant='round'
            color='tertiary'
            alignItems='flex-start'
            haptic
            children='Continue with Apple'
        />
    );
});

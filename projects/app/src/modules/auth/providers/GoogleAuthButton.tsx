import React, { FC, memo, useId } from 'react';
import { useConfig } from '../../../config/ConfigProvider';
import { icons } from '../../../ui';
import { AuthButton, AuthButtonOuterProps } from '../AuthButton';

export const GoogleAuthButton: FC<AuthButtonOuterProps> = memo(({ onSuccess }) => {
    const nonce = useId();
    const config = useConfig();

    return (
        <AuthButton
            title='Google'
            onSuccess={onSuccess}
            Icon={icons.GoogleLogo}
            endpoint={config.auth.google.endpoint}
            params={{
                client_id: config.auth.google.clientId,
                response_type: 'id_token',
                prompt: 'select_account',
                scope: 'profile email',
                nonce,
            }}
            extractPayload={(url) => {
                const idToken = new URLSearchParams(url.hash).get('#id_token');
                if (!idToken) {
                    throw new Error('Unable to sign in with Google');
                }

                return {
                    provider: 'google',
                    payload: { idToken },
                };
            }}
        />
    );
});

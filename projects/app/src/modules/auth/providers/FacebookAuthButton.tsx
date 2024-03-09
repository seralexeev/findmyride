import React, { FC, memo, useId } from 'react';
import { icons } from '../../../ui';
import { AuthButton, AuthButtonOuterProps } from '../AuthButton';

export const FacebookAuthButton: FC<AuthButtonOuterProps> = memo(({ onSuccess }) => {
    const state = useId();
    const nonce = useId();

    return (
        <AuthButton
            title='Facebook'
            onSuccess={onSuccess}
            Icon={icons.FacebookLogo}
            endpoint='https://www.facebook.com/v12.0/dialog/oauth'
            params={{
                client_id: '432125612037314',
                response_type: 'token',
                scope: 'public_profile,email',
                state,
                auth_type: 'reauthorize',
                auth_nonce: nonce,
            }}
            extractPayload={(url) => {
                const accessToken = new URLSearchParams(url.hash).get('#access_token');
                if (!accessToken) {
                    throw new Error('Unable to sign in with Facebook');
                }

                return {
                    provider: 'facebook',
                    payload: { accessToken },
                };
            }}
        />
    );
});

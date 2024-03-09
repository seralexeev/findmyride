import React, { FC } from 'react';
import { ui } from '../../ui';
import { AuthButtonOuterProps } from './AuthButton';
import { AppleAuthButton } from './providers/AppleAuthButton';
import { FacebookAuthButton } from './providers/FacebookAuthButton';
import { GoogleAuthButton } from './providers/GoogleAuthButton';

const buttons = [GoogleAuthButton, FacebookAuthButton, AppleAuthButton];

export const AuthButtons: FC<AuthButtonOuterProps> = ({ onSuccess }) => {
    return (
        <ui.Stack spacing fullWidth>
            {buttons.map((Button, i) => (
                <ui.Transition key={i} inAnimation='fadeInLeft' delay={i * 100} duration={300}>
                    <Button onSuccess={onSuccess} />
                </ui.Transition>
            ))}
        </ui.Stack>
    );
};

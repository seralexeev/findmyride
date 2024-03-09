import { RpcInput } from '@findmyride/api';
import React, { ComponentType, FC, ReactNode } from 'react';
import { SvgProps } from 'react-native-svg';
import { ui } from '../../ui';
import { useOAuthLogin } from './services';

export type AuthButtonOuterProps = {
    onSuccess?: () => void;
};

type AuthButtonProps = AuthButtonOuterProps & {
    title: string;
    Icon: ReactNode | ComponentType<SvgProps>;
    endpoint: string;
    params: Record<string, string>;
    extractPayload: (url: URL) => RpcInput<'auth/login'>;
};

export const AuthButton: FC<AuthButtonProps> = ({ Icon, title, params, endpoint, extractPayload, onSuccess }) => {
    const onPress = useOAuthLogin({ endpoint, params, extractPayload });

    return (
        <ui.Button
            StartIcon={Icon}
            onPress={() => onPress().then(onSuccess)}
            size='large'
            borderVariant='round'
            color='tertiary'
            alignItems='flex-start'
            haptic
            children={`Continue with ${title}`}
        />
    );
};

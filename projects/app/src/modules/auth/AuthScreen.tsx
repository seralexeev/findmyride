import { useNavigation } from '@react-navigation/native';
import React, { FC } from 'react';
import { icons, ui } from '../../ui';
import { AuthView } from './AuthView';

export const AuthScreen: FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { goBack } = useNavigation();

    return (
        <ui.Screen padding backgroundColor='#fff' topSafeArea={false} name='AuthScreen'>
            <ui.Box flexCenter row justifyContent='space-between'>
                <ui.Box flex />
                <ui.Text variant='title2' children='Sign In' padding={2} flex center />
                <ui.Box flex alignItems='flex-end' paddingRight={2} onPress={goBack}>
                    <ui.Button borderVariant='round' StartIcon={icons.Cross} size='small' color='tertiary' />
                </ui.Box>
            </ui.Box>
            <AuthView onSuccess={onSuccess} />
        </ui.Screen>
    );
};

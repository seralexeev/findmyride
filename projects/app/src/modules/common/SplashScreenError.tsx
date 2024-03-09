import React, { FC } from 'react';
import { ui } from '../../ui';
import { DevScreenHiddenAction } from './DevScreen';

type SplashScreenErrorProps = {
    error?: unknown;
    refetch?: () => void;
};

export const SplashScreenError: FC<SplashScreenErrorProps> = ({ error, refetch }) => {
    const message = (error as any)?.message;

    return (
        <ui.Transition flex flexCenter inAnimation='fadeIn' visible>
            <DevScreenHiddenAction>
                <ui.LottieBox wh={128} source={require('../../ui/lottie/error.json')} autoPlay loop={false} marginBottom />
            </DevScreenHiddenAction>
            <ui.Box marginBottom={2} flexCenter>
                <ui.Text marginBottom center children='That did not go as planned' semiBold />
                {message && <ui.Text marginBottom variant='caption' children={message} center />}
            </ui.Box>
            {refetch && <ui.Button haptic onPress={refetch} children='Refetch' borderVariant='round' width={128} />}
        </ui.Transition>
    );
};

import React, { FC, memo } from 'react';
import { ui } from '../../ui';

type SplashLoaderProps = {
    visible?: boolean;
    label?: string;
};

export const SplashLoader: FC<SplashLoaderProps> = memo(({ visible = true }) => {
    return (
        <ui.Transition flex flexCenter inAnimation='fadeIn' visible={visible}>
            <ui.LottieBox wh={128} source={require('../../ui/lottie/cycling.json')} autoPlay loop />
            {/* <ui.Text children={label} /> WTF, doesn't work in the prod build */}
        </ui.Transition>
    );
});

export const FillSplashLoader: FC<SplashLoaderProps> = memo(({ visible = true, label }) => {
    return (
        <ui.Box fillContainer position={visible ? 'absolute' : 'relative'} backgroundColor='#fff'>
            <SplashLoader visible={visible} label={label} />
        </ui.Box>
    );
});

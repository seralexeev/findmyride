import React, { FC } from 'react';
import { ui } from '..';

type EmptyProps = ui.BoxProps;

export const Empty: FC<EmptyProps> = ({ children, ...rest }) => {
    return (
        <ui.Box {...rest} flex flexCenter>
            {/* <ui.LottieBox source={require('../lottie/empty.json')} autoPlay loop={false} height={50} /> */}
            {typeof children === 'string' ? <ui.Text variant='caption' children={children} marginTop center /> : children}
        </ui.Box>
    );
};

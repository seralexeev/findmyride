import React, { FC } from 'react';
import { useConfig } from '../../../config/ConfigProvider';
import { useEvent } from '../../../hooks/useEvent';
import { icons, ui } from '../../../ui';
import { useShareScreen } from '../../share/ShareScreen';

type ShareButtonProps = {
    ride: {
        id: string;
        organizer: { name: string };
    };
};

export const useShareRide = (ride: ShareButtonProps['ride']) => {
    const config = useConfig();
    const share = useShareScreen();

    return useEvent(() => {
        return share({
            title: 'Share Ride',
            message: `Ride with ${ride.organizer.name}`,
            url: `${config.web.url}/rides/${ride.id}`,
        });
    });
};

export const ShareButton: FC<ShareButtonProps> = ({ ride }) => {
    const shareRide = useShareRide(ride);

    return <ui.Button borderVariant='round' StartIcon={icons.Share} color='transparent' onPress={shareRide} />;
};

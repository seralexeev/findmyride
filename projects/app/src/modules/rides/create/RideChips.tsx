import { TrackSource } from '@findmyride/api';
import React, { FC, ReactNode, memo } from 'react';
import { Linking } from 'react-native';
import { icons, ui } from '../../../ui';
import { getTrackSourceConfig } from './utils';

type RideChipsProps = {
    ride: {
        id?: string | null;
        trackSourceUrl?: string | null;
        trackSource: TrackSource;
        gpxTrackId: string | null;
        gpxTrackUrl?: string | null;
        chatLink: string | null;
    };
    hideChat?: boolean;
};

export const RideChips: FC<RideChipsProps> = memo(({ ride, hideChat }) => {
    const config = getTrackSourceConfig(ride.trackSource);
    const navigateSource = () => ride.trackSourceUrl && Linking.openURL(ride.trackSourceUrl);

    const additionalButtons: ReactNode[] = [];
    if (ride.trackSource !== 'gpx' && ride.trackSource !== 'manual') {
        additionalButtons.push(
            <ui.Button
                StartIcon={config.Icon}
                // borderVariant='round'
                color='light'
                fillIcon={config.fillIcon}
                children={config.name}
                onPress={navigateSource}
            />,
        );
    }

    if (ride.gpxTrackUrl) {
        additionalButtons.push(
            <ui.Button
                StartIcon={icons.FileGpx}
                // borderVariant='round'
                color='light'
                children='GPX'
                onPress={() => ride.gpxTrackUrl && Linking.openURL(ride.gpxTrackUrl)}
            />,
        );
    }

    if (ride.chatLink && !hideChat) {
        additionalButtons.push(
            <ui.Button
                StartIcon={icons.FileGpx}
                fillIcon={false}
                // borderVariant='round'
                color='light'
                children='Chat'
                onPress={() => Linking.openURL(ride.chatLink!)}
            />,
        );
    }

    return additionalButtons.length > 0 ? (
        <ui.Stack row spacing innerGrow paddingHorizontal={2} children={additionalButtons} marginBottom={2} />
    ) : null;
});

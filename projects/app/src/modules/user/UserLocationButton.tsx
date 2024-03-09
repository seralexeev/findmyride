import { Colors } from '@findmyride/api';
import React, { FC } from 'react';
import { icons, ui } from '../../ui';
import { useProfile } from './ProfileProvider';
import { useSetUserLocation } from './services';

export const UserLocationButton: FC = () => {
    const onPress = useSetUserLocation();
    const { profile } = useProfile();

    return (
        <ui.Button
            color='tertiary'
            flex
            marginRight
            fillIcon
            StartIcon={icons.Marker}
            alignItems='flex-start'
            onPress={onPress}
            caption={!profile.location}
            iconColor={Colors.primary}
            children={profile.useCurrentLocation ? 'Use Your Current Location' : profile.location?.name ?? 'Select Location'}
        />
    );
};

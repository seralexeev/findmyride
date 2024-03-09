import React from 'react';
import { useEvent } from '../../hooks/useEvent';
import { useScreen } from '../../ui/ScreenProvider';
import { SelectUserLocationScreen } from './SelectUserLocationScreen';
import { UserProfileScreen } from './UserProfileScreen';

export const useSetUserLocation = () => {
    const { showScreen } = useScreen();

    return useEvent(() => {
        showScreen({ children: <SelectUserLocationScreen /> });
    });
};

export const useOpenUserProfile = () => {
    const { showScreen } = useScreen();

    return useEvent((id: string) => {
        return showScreen({ children: <UserProfileScreen id={id} /> });
    });
};

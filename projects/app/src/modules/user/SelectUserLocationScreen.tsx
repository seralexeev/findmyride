import { useNavigation } from '@react-navigation/native';
import React, { FC, useState } from 'react';
import { useInvalidate, useRpc } from '../../api/rpc';
import { useLoadCallback } from '../../hooks/useLoadingCallback';
import { ui } from '../../ui';
import { InteractiveMap } from '../map/InteractiveMap';
import { SelectLocationView } from '../map/SelectLocationScreen';
import { useProfile } from './ProfileProvider';

export const SelectUserLocationScreen: FC = () => {
    const { profile } = useProfile();
    const [setCurrentLocation] = useRpc('user/set_current_location').useMutation();
    const [updateProfile] = useRpc('user/update_profile').useMutation();
    const invalidate = useInvalidate();
    const invalidateAll = () => invalidate(['user/profile', 'ride/find', 'social/get_user_info']);
    const [useCurrentLocation, setUseCurrentLocation] = useState(profile.useCurrentLocation);
    const [onUseCurrentLocationChange, useCurrentLocationLoading] = useLoadCallback((useCurrentLocation: boolean) => {
        setUseCurrentLocation(useCurrentLocation);
        return updateProfile({ useCurrentLocation }).then(invalidateAll);
    });
    const [location, setLocation] = useState(profile.location);
    const { goBack } = useNavigation();

    const [onSave, onSaveLoading] = useLoadCallback(() => {
        if (location) {
            return setCurrentLocation(location).then(invalidateAll).then(goBack);
        } else {
            goBack();
        }
    });

    return (
        <ui.Screen
            name='SelectUserLocationScreen'
            header='Select Location'
            bottomSafeArea={false}
            headerRight={
                !useCurrentLocation && (
                    <ui.Button children='Save' onPress={onSave} loading={onSaveLoading} size='small' borderVariant='round' />
                )
            }
        >
            <ui.Box
                row
                alignItems='center'
                white
                paddingLeft={2}
                paddingRight
                paddingVertical
                justifyContent='space-between'
                borderBottomWidth
                borderColor
            >
                <ui.Box row alignItems='center'>
                    <ui.Text children='Use Your Current Location' semiBold marginRight />
                    {useCurrentLocationLoading && <ui.Spinner wh={16} />}
                </ui.Box>
                <ui.Switcher onChange={onUseCurrentLocationChange} value={useCurrentLocation} />
            </ui.Box>
            {useCurrentLocation ? (
                <InteractiveMap toolbarBottom={0} flex askPermissionForce />
            ) : (
                <SelectLocationView value={profile.location} askPermission onSelect={setLocation} />
            )}
        </ui.Screen>
    );
};

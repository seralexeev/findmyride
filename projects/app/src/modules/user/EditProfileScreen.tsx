import { formatSlug, RpcInput } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { Alert } from 'react-native';
import { Cell, Section, TableView } from 'react-native-tableview-simple';
import { useInvalidate, useRpc } from '../../api/rpc';
import { useEvent } from '../../hooks/useEvent';
import { useLoadCallback } from '../../hooks/useLoadingCallback';
import { ui } from '../../ui';
import { TextInputScreen } from '../../ui/components';
import { useScreen } from '../../ui/ScreenProvider';
import { useTheme } from '../../ui/ThemeProvider';
import { useLinkStrava } from '../auth/services';
import { useFileUpload } from '../files/useFileUpload';
import { BikeTypeIcon } from '../rides/BikeTypeIcon';
import { BikeTypeSelector } from '../rides/create/BikeTypeSelector';
import { RiderLevelSelector } from '../rides/create/RideLevelSelector';
import { RiderLevelIcon } from '../rides/RiderLevelIcon';
import { useProfile } from './ProfileProvider';
import { useSetUserLocation } from './services';
import { ProfileAvatar } from './UserAvatar';

export const EditProfileScreen: FC = () => {
    const { border } = useTheme();
    const { logout, profile } = useProfile();
    const { showScreen } = useScreen();
    const [updateProfileImpl] = useRpc('user/update_profile').useMutation();
    const { upload } = useFileUpload();
    const invalidate = useInvalidate();
    const onChangeLocation = useSetUserLocation();
    const strava = useLinkStrava();

    const updateProfile = (input: RpcInput<'user/update_profile'>) => {
        return updateProfileImpl(input).then(() => invalidate(['social/get_user_info', 'user/profile']));
    };

    const [onAvatarChange, avatarLoading] = useLoadCallback(() => {
        return upload('photo').then((file) => updateProfile({ avatarId: file.id }));
    });

    const [onLogout, logoutLoading] = useLoadCallback(() => {
        return new Promise((res, rej) => {
            Alert.alert('Log Out', 'Are you sure?', [
                { text: 'Cancel', onPress: rej, style: 'cancel' },
                { text: 'OK', onPress: () => logout().then(res) },
            ]);
        });
    });

    const [onDeleteAccount, deletingAccount] = useLoadCallback(() => {
        return new Promise((res, rej) => {
            Alert.alert('Delete Account', 'Are you sure?', [
                { text: 'Cancel', onPress: rej, style: 'cancel' },
                { text: 'OK', onPress: () => logout({ deleteAccount: true }).then(res) },
            ]);
        });
    });

    const [stravaLink, stravaLinking] = useLoadCallback(strava.link);
    const [stravaUnlink, stravaUnlinking] = useLoadCallback(strava.unlink);

    return (
        <ui.Screen name='EditProfileScreen' header='Edit Profile' white bottomSafeArea={false}>
            <ui.ScrollView flexGrow>
                <ui.Box backgroundColor flex>
                    <ui.Box flexCenter padding={3} white borderBottomWidth borderColor>
                        <ui.Box borderWidth round borderColor onPress={onAvatarChange} position='relative' marginBottom>
                            <ProfileAvatar size={96} />
                            {avatarLoading && (
                                <ui.Box fillContainer flexCenter white opacity={0.8}>
                                    <ui.Spinner wh={16} zIndex={1} />
                                </ui.Box>
                            )}
                        </ui.Box>
                        <ui.Text variant='caption'>Change Your Profile Photo</ui.Text>
                    </ui.Box>
                    <TableView appearance='light'>
                        <Section header='GENERAL' separatorTintColor={border.color}>
                            <Cell
                                allowFontScaling={false}
                                cellStyle='RightDetail'
                                cellAccessoryView={<ui.CellChevron />}
                                title='Name'
                                detail={profile.name}
                                onPress={() =>
                                    showScreen({
                                        children: (
                                            <TextInputScreen
                                                header='Name'
                                                value={profile.name}
                                                onChange={(name) => updateProfile({ name })}
                                            />
                                        ),
                                    })
                                }
                            />
                            <Cell
                                allowFontScaling={false}
                                cellStyle='RightDetail'
                                cellAccessoryView={<ui.CellChevron />}
                                title='Username'
                                detail={formatSlug(profile.slug)}
                                onPress={() =>
                                    showScreen({
                                        children: (
                                            <SlugInput value={profile.slug} onChange={(slug) => updateProfile({ slug })} />
                                        ),
                                    })
                                }
                            />
                            <Cell
                                allowFontScaling={false}
                                cellStyle={profile.bio ? 'Subtitle' : 'Basic'}
                                title='Bio'
                                detail={profile.bio ?? ''}
                                cellAccessoryView={<ui.CellChevron />}
                                onPress={() =>
                                    showScreen({
                                        children: (
                                            <TextInputScreen
                                                header='Bio'
                                                value={profile.bio}
                                                multiline
                                                numberOfLines={10}
                                                onChange={(bio) => updateProfile({ bio })}
                                            />
                                        ),
                                    })
                                }
                            />
                            <Cell
                                allowFontScaling={false}
                                cellStyle={profile.location?.name ? 'Subtitle' : 'Basic'}
                                title='Location'
                                detail={profile.location?.name ?? ''}
                                onPress={() => void onChangeLocation()}
                                cellAccessoryView={<ui.CellChevron />}
                            />
                        </Section>

                        <Section header='RIDING' separatorTintColor={border.color}>
                            <Cell
                                allowFontScaling={false}
                                title='Level'
                                cellAccessoryView={
                                    <ui.Stack row spacing alignItems='center'>
                                        <RiderLevelIcon level={profile.level} size={12} />
                                        <ui.CellChevron />
                                    </ui.Stack>
                                }
                                onPress={() =>
                                    showScreen({
                                        children: (
                                            <RiderLevelSelector.Screen
                                                value={profile.level}
                                                onChange={(level) => updateProfile({ level })}
                                            />
                                        ),
                                    })
                                }
                            />
                            <Cell
                                allowFontScaling={false}
                                title='Bike Type'
                                cellAccessoryView={
                                    <ui.Stack row spacing alignItems='center'>
                                        {profile.bikeType.map((x) => (
                                            <BikeTypeIcon key={x} type={x} size={20} />
                                        ))}
                                        <ui.CellChevron />
                                    </ui.Stack>
                                }
                                onPress={() =>
                                    showScreen({
                                        children: (
                                            <BikeTypeSelector.Screen
                                                value={profile.bikeType[0] ?? 'road'}
                                                onChange={(bikeType) => updateProfile({ bikeType: [bikeType] })}
                                            />
                                        ),
                                    })
                                }
                            />
                        </Section>

                        <Section header='AUTH' separatorTintColor={border.color}>
                            {strava.isLinked ? (
                                <Cell
                                    allowFontScaling={false}
                                    cellStyle='Basic'
                                    title='Unlink Strava'
                                    onPress={() => void stravaUnlink()}
                                    titleTextColor='#E33122'
                                    cellAccessoryView={
                                        stravaUnlinking ? <ui.Spinner wh={16} paletteColor='primary' /> : undefined
                                    }
                                />
                            ) : (
                                <Cell
                                    allowFontScaling={false}
                                    cellStyle='Basic'
                                    title='Link Strava'
                                    onPress={() => void stravaLink()}
                                    cellAccessoryView={
                                        stravaLinking ? <ui.Spinner wh={16} paletteColor='primary' /> : undefined
                                    }
                                />
                            )}
                            <Cell
                                allowFontScaling={false}
                                cellStyle='Basic'
                                title='Log Out'
                                onPress={() => void onLogout()}
                                cellAccessoryView={logoutLoading ? <ui.Spinner wh={16} paletteColor='primary' /> : undefined}
                                titleTextColor='#E33122'
                            />
                            <Cell
                                allowFontScaling={false}
                                cellStyle='Basic'
                                title='Delete Account'
                                onPress={() => void onDeleteAccount()}
                                cellAccessoryView={deletingAccount ? <ui.Spinner wh={16} paletteColor='primary' /> : undefined}
                                titleTextColor='#E33122'
                            />
                        </Section>
                    </TableView>
                </ui.Box>
            </ui.ScrollView>
        </ui.Screen>
    );
};

const SlugInput: FC<{ value: string; onChange: (value: string) => void }> = memo(({ onChange, value }) => {
    const [mutateAsync] = useRpc('user/validate_slug').useMutation();
    const validate = useEvent((slug: string | null) => (slug ? mutateAsync({ slug }) : false));

    return (
        <TextInputScreen
            header='Username'
            value={value}
            validate={validate}
            onChange={onChange}
            hint='Username can contain letters numbers and underscores only'
        />
    );
});

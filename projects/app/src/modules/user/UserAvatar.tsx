import { FileSchema } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../ui';
import { useProfile } from './ProfileProvider';

type UserAvatarProps = {
    size?: number;
    user: {
        name: string;
        avatar: FileSchema | null;
    };
};

export const ProfileAvatar: FC<{ size?: number }> = memo(({ size }) => {
    const { profile } = useProfile();

    return <UserAvatar user={profile} size={size} />;
});

export const UserAvatar: FC<UserAvatarProps> = memo(({ user, size = 32 }) => {
    return user.avatar ? (
        <ui.FileImage image={user.avatar} round width={size} height={size} overflowHidden borderColor borderWidth />
    ) : (
        <ui.Image source={require('../../ui/assets/logo.png')} wh={size} round />
    );
});

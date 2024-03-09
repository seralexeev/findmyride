import React, { FC } from 'react';
import { ui } from '../../ui';
import { useProfile } from './ProfileProvider';
import { ImageSchema } from '@findmyride/api';

type UserAvatarProps = {
    size?: number;
    user: {
        name: string;
        avatar: ImageSchema | null;
    };
};

export const ProfileAvatar: FC<{ size?: number }> = ({ size }) => {
    const { profile } = useProfile();

    return <UserAvatar user={profile} size={size} />;
};

export const UserAvatar: FC<UserAvatarProps> = ({ user, size = 32 }) => {
    return user.avatar ? (
        <ui.FileImage
            image={user.avatar}
            size={getSize(size)}
            round
            width={size}
            height={size}
            overflowHidden
            borderColor
            borderWidth
        />
    ) : (
        <ui.Image source={require('../../ui/assets/logo.png')} wh={size} round />
    );
};

const getSize = (size: number, x: number = 2): ImageSize => {
    if (size * x <= 128) {
        return 'small';
    }

    if (size * x <= 512) {
        return 'medium';
    }

    return 'large';
};

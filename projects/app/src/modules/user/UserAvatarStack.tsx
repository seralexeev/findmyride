import { ImageSchema } from '@findmyride/api';
import React, { FC } from 'react';
import { ui } from '../../ui';
import { UserAvatar } from './UserAvatar';

type UserAvatarStackProps = {
    size?: number;
    users: Array<{
        id: string;
        name: string;
        avatar: ImageSchema | null;
    }>;
};

export const UserAvatarStack: FC<UserAvatarStackProps> = ({ users, size }) => {
    return (
        <ui.Box row>
            {users.map((x) => (
                <ui.Box key={x.id} marginLeft={-1.5} round white>
                    <UserAvatar user={x} size={size} />
                </ui.Box>
            ))}
        </ui.Box>
    );
};

import React, { Fragment, ReactNode, VFC } from 'react';
import { ui } from '../../ui';
import { useProfile } from './ProfileProvider';
import { UserAvatar } from './UserAvatar';
import { useOpenUserProfile } from './services';

export type UserMediaCardVm = {
    id: string;
    name: string;
    avatar: ImageWithSizes | null;
};

type UserMediaCardProps = ui.BoxProps & {
    aux?: ReactNode;
    user: UserMediaCardVm;
    navigateByName?: boolean;
    title?: ReactNode;
    subtitle?: ReactNode;
    numberOfSubtitleLines?: number;
};

export const UserMediaCard: VFC<UserMediaCardProps> = ({
    aux,
    user,
    title,
    subtitle,
    navigateByName = true,
    numberOfSubtitleLines = 2,
    ...rest
}) => {
    const { profile } = useProfile();
    const openProfile = useOpenUserProfile();
    const onNavigate = profile.id !== user.id ? () => openProfile(user.id) : undefined;

    const props: ui.BoxProps = {
        ...rest,
        row: true,
        justifyContent: 'space-between',
        children: (
            <Fragment>
                <ui.Box row alignItems='center' flex>
                    <ui.Box marginRight onPress={onNavigate}>
                        <UserAvatar user={user} size={44} />
                    </ui.Box>
                    <ui.Box flex>
                        <ui.Box onPress={navigateByName ? onNavigate : undefined}>
                            <ui.Text
                                semiBold
                                children={typeof title === 'string' ? title : user.name ?? 'Eddy'}
                                numberOfLines={1}
                            />
                        </ui.Box>
                        {typeof subtitle === 'string' ? (
                            <ui.Text variant='caption' numberOfLines={numberOfSubtitleLines} children={subtitle} />
                        ) : (
                            subtitle
                        )}
                    </ui.Box>
                </ui.Box>
                {aux && <ui.Box children={aux} marginLeft={2} />}
            </Fragment>
        ),
    };

    return <ui.Box {...props} />;
};

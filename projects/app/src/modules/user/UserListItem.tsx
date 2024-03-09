import { RpcInput, RpcItemsOutput, formatSlug } from '@findmyride/api';
import React, { FC, Fragment, memo, useState } from 'react';
import { useInvalidate, useRpc } from '../../api/rpc';
import { ui } from '../../ui';
import { useProfile } from './ProfileProvider';
import { UserMediaCard } from './UserMediaCard';

export const UserListItem: FC<{ item: RpcItemsOutput<'social/find_friends'> }> = memo(({ item }) => {
    const [mutateAsync] = useRpc('social/change_friendship_status').useMutation();
    const invalidate = useInvalidate();
    const [friendshipStatus, setFriendshipStatus] = useState(item.friendshipStatus);
    const { profile } = useProfile();

    const changeFriendshipStatus = (action: RpcInput<'social/change_friendship_status'>['action']) => {
        return mutateAsync({ action, userId: item.user.id }).then(() => {
            setFriendshipStatus((prev) => ({ ...prev, following: action === 'follow' ? true : false }));
            return invalidate(['social/get_user_info']);
        });
    };

    return (
        <Fragment>
            <UserMediaCard
                user={item.user}
                subtitle={formatSlug(item.user.slug)}
                aux={
                    profile.id !== item.user.id && (
                        <ui.Box row flex flexCenter width={104} marginRight>
                            {friendshipStatus.following ? (
                                <ui.Button
                                    color='light'
                                    onPress={() => changeFriendshipStatus('unfollow')}
                                    children='Following'
                                    size='small'
                                    haptic
                                    flex
                                />
                            ) : (
                                <ui.Button
                                    color='primary'
                                    onPress={() => changeFriendshipStatus('follow')}
                                    children={friendshipStatus.followedBy ? 'Follow Back' : 'Follow'}
                                    size='small'
                                    haptic
                                    flex
                                />
                            )}
                        </ui.Box>
                    )
                }
            />
        </Fragment>
    );
});

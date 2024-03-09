import { useFocusEffect } from '@react-navigation/native';
import { keepPreviousData } from '@tanstack/react-query';
import React, { FC } from 'react';
import { useRpc } from '../../api/rpc';
import { useEvent } from '../../hooks/useEvent';
import { icons, ui } from '../../ui';

type ChatButtonProps = { roomId: string; title?: string };

export const ChatButton: FC<ChatButtonProps> = ({ roomId, title }) => {
    const unreadCountQuery = useRpc('chat/get_unread_count').useQuery({
        placeholderData: keepPreviousData,
        refetchInterval: 5000,
        input: { roomId },
    });

    useFocusEffect(useEvent(() => void unreadCountQuery.refetch()));

    const unreadCount = unreadCountQuery.data?.count ?? 0;

    return (
        <ui.Box position='relative'>
            <ui.Button StartIcon={icons.Chat} color='transparent' fillIcon={false} children={title} />
            {unreadCount > 0 && (
                <ui.Box
                    absolute
                    left={2.5}
                    round
                    bgPalette='primary'
                    minWidth={16}
                    height={16}
                    paddingHorizontal={0.5}
                    paddingTop={0.5}
                >
                    <ui.Text children={unreadCount} semiBold color='white' fontSize={10} center />
                </ui.Box>
            )}
        </ui.Box>
    );
};

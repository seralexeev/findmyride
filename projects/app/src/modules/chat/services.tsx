import React from 'react';
import { ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { ChatRoom } from './ChatRoom';

export const useOpenChatRoom = () => {
    const { showScreen } = useScreen();

    return (roomId: string) => {
        return showScreen({
            children: (
                <ui.Screen name='ChatRoomScreen' header='Chat' white>
                    <ChatRoom roomId={roomId} />
                </ui.Screen>
            ),
        });
    };
};

import { EntityAccessor } from '@untype/orm';
import type { ChatRoom } from '../generated/ChatRoom';

export class ChatRoomAccessor extends EntityAccessor<ChatRoom> {
    public constructor() {
        super('ChatRoom');
    }
}

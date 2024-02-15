import { EntityAccessor } from '@untype/orm';
import type { Message } from '../generated/Message';
import { User } from '../generated/User';

export class MessageAccessor extends EntityAccessor<Message> {
    public constructor() {
        super('Message');
    }

    public Selector = this.createSelector({
        id: true,
        user: User.Selector,
        text: true,
        createdAt: true,
        updatedAt: true,
    });
}

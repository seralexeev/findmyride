import { EntityAccessor } from '@untype/orm';
import type { User2Room } from '../generated/User2Room';

export class User2RoomAccessor extends EntityAccessor<User2Room> {
    public constructor() {
        super('User2Room');
    }
}

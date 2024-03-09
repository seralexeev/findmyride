import { EntityAccessor } from '@untype/orm';
import type { UserSession } from '../generated/UserSession';

export class UserSessionAccessor extends EntityAccessor<UserSession> {
    public constructor() {
        super('UserSession');
    }
}

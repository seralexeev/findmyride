import { EntityAccessor } from '@untype/orm';
import type { UserDevice } from '../generated/UserDevice';

export class UserDeviceAccessor extends EntityAccessor<UserDevice> {
    public constructor() {
        super('UserDevice');
    }
}

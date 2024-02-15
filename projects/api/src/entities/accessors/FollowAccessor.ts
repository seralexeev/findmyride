import { EntityAccessor } from '@untype/orm';
import type { Follow } from '../generated/Follow';

export class FollowAccessor extends EntityAccessor<Follow> {
    public constructor() {
        super('Follow');
    }
}

import { EntityAccessor } from '@untype/orm';
import type { StravaAccount } from '../generated/StravaAccount';

export class StravaAccountAccessor extends EntityAccessor<StravaAccount> {
    public constructor() {
        super('StravaAccount');
    }
}

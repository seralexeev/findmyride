import { EntityAccessor } from '@untype/orm';
import type { Users2Ride } from '../generated/Users2Ride';

export class Users2RideAccessor extends EntityAccessor<Users2Ride> {
    public constructor() {
        super('Users2Ride');
    }
}

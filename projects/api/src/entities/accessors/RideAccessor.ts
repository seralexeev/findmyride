import { EntityAccessor } from '@untype/orm';
import type { Ride } from '../generated/Ride';

export class RideAccessor extends EntityAccessor<Ride> {
    public constructor() {
        super('Ride');
    }
}

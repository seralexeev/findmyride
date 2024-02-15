import { EntityAccessor } from '@untype/orm';
import type { RideImage } from '../generated/RideImage';

export class RideImageAccessor extends EntityAccessor<RideImage> {
    public constructor() {
        super('RideImage');
    }
}

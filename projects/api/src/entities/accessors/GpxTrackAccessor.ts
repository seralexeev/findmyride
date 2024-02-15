import { EntityAccessor } from '@untype/orm';
import type { GpxTrack } from '../generated/GpxTrack';

export class GpxTrackAccessor extends EntityAccessor<GpxTrack> {
    public constructor() {
        super('GpxTrack');
    }
}

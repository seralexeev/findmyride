import { EntityAccessor } from '@untype/orm';
import type { File } from '../generated/File';

export class FileAccessor extends EntityAccessor<File> {
    public constructor() {
        super('File');
    }

    public ImageSelector = this.createSelector({
        id: true,
        blurhash: true,
        url: true,
        height: true,
        width: true,
    });
}

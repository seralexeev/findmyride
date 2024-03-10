import { EntityAccessor } from '@untype/orm';
import { File } from '../generated/File';
import type { User } from '../generated/User';

export class UserAccessor extends EntityAccessor<User> {
    public constructor() {
        super('User');
    }

    public Selector = this.createSelector({
        id: true,
        name: true,
        slug: true,
        avatar: File.ImageSelector,
        locationName: true,
        level: true,
    });
}

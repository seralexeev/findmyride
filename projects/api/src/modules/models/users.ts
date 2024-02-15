import { SelectorShape } from '@untype/orm';
import { z } from 'zod';
import { User } from '../../entities';
import { ActionDef } from './actions';

export type UserVm = SelectorShape<User, typeof User.Selector>;

export type AuthAction =
    | ActionDef<'@auth/SET_SECURITY_TOKENS', { userId: string; accessToken: string; refreshToken: string }>
    | ActionDef<'@auth/REMOVE_SECURITY_TOKENS'>;

export type NotificationStatus = z.infer<typeof NotificationStatus>;
export const NotificationStatus = z.union([
    z.literal('unavailable'),
    z.literal('blocked'),
    z.literal('denied'),
    z.literal('granted'),
    z.literal('limited'),
]);

export const formatSlug = (slug: string) => {
    return `@${slug}`;
};

import { LocationWithName, Point } from '@untype/geo';
import { BadRequestError, object } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { File, User, UserDevice } from '../../entities';
import { Context } from '../models/context';
import { BikeType, RiderLevel } from '../rides/models';
import { rpc } from '../rpc';

@singleton()
export class UserController {
    public ['user/profile'] = rpc({
        resolve: async ({ ctx }) => {
            const profile = await User.findByPkOrError(ctx.t, {
                pk: { id: ctx.user.id },
                selector: {
                    id: true,
                    name: true,
                    location: ['geojson'],
                    locationName: true,
                    avatar: File.Selector,
                    slug: true,
                    bio: true,
                    bikeType: true,
                    level: true,
                    isAnonymous: true,
                    stravaId: true,
                    useCurrentLocation: true,
                },
            });

            return {
                ...object.pick(profile, [
                    'id',
                    'name',
                    'avatar',
                    'slug',
                    'bio',
                    'bikeType',
                    'level',
                    'isAnonymous',
                    'useCurrentLocation',
                ]),
                location: profile.location
                    ? { name: profile.locationName ?? 'Location on the Map', location: profile.location.geojson }
                    : null,
                stravaIsLinked: Boolean(profile.stravaId),
            };
        },
    });

    public ['user/update_profile'] = rpc({
        input: z.object({
            name: z.string().optional(),
            slug: z.string().optional(),
            bio: z.string().optional(),
            avatarId: z.string().optional(),
            bikeType: z.array(BikeType).optional(),
            level: RiderLevel.optional(),
            useCurrentLocation: z.boolean().optional(),
        }),
        resolve: async ({ ctx, input }) => {
            if (input.slug != null) {
                if (!(await this.validateSlugImpl(ctx, input.slug))) {
                    throw new BadRequestError('User name is not valid');
                }

                input.slug = input.slug?.toLocaleLowerCase();
            }

            await User.update(ctx.t, {
                pk: { id: ctx.user.id },
                patch: input,
            });
        },
    });

    public ['user/set_current_location'] = rpc({
        input: LocationWithName,
        resolve: async ({ ctx, input }) => {
            await User.update(ctx.t, {
                pk: { id: ctx.user.id },
                patch: {
                    locationName: input.name,
                    location: input.location,
                },
            });
        },
    });

    public ['user/update_location'] = rpc({
        input: z.object({ location: Point }),
        resolve: async ({ ctx, input }) => {
            const device = await UserDevice.findFirstOrError(ctx.t, {
                filter: {
                    id: { equalTo: ctx.device.deviceId },
                    userId: { equalTo: ctx.user.id },
                },
                selector: ['id'],
            });

            await UserDevice.update(ctx.t, {
                pk: { id: device.id },
                patch: { location: input.location, locationUpdatedAt: new Date() },
            });
        },
    });

    public ['user/validate_slug'] = rpc({
        input: z.object({ slug: z.string() }),
        resolve: ({ ctx, input }) => this.validateSlugImpl(ctx, input.slug),
    });

    private validateSlugImpl = async (ctx: Context, slug: string) => {
        if (!slug) {
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(slug)) {
            return false;
        }

        const exists = await User.exists(ctx.t, {
            filter: {
                id: { notEqualTo: ctx.user.id },
                slug: { equalTo: slug.toLocaleLowerCase() },
            },
        });

        return !exists;
    };
}

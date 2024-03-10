import { InvalidOperationError } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { File, RideImage, User } from '../../entities';
import { rpc } from '../rpc';

@singleton()
export class RideImageController {
    public ['image/attach'] = rpc({
        input: z.object({
            fileIds: z.array(z.string()),
            rideId: z.string(),
            description: z.string().optional().nullable(),
        }),
        resolve: async ({ ctx, input }) => {
            for (const fileId of input.fileIds) {
                await RideImage.create(ctx.t, {
                    item: {
                        fileId: fileId,
                        userId: ctx.user.id,
                        description: input.description,
                        rideId: input.rideId,
                    },
                });
            }
        },
    });

    public ['image/by_image_id'] = rpc({
        anonymous: true,
        input: z.object({
            imageId: z.string(),
        }),
        resolve: async ({ ctx, input }) => {
            const { rideId } = await RideImage.findByPkOrError(ctx.t, {
                pk: { id: input.imageId },
                selector: ['rideId'],
            });

            const items = await RideImage.find(ctx.t, {
                filter: { rideId: { equalTo: rideId } },
                selector: {
                    id: true,
                    file: File.ImageSelector,
                    description: true,
                    user: User.Selector,
                    createdAt: true,
                    rideId: true,
                    ride: ['id', 'title', 'description'],
                },
                orderBy: [['createdAt', 'DESC']],
            });

            return { items };
        },
    });

    public ['image/ride_images'] = rpc({
        input: z.object({ rideId: z.string() }),
        resolve: async ({ ctx, input }) => {
            const items = await RideImage.find(ctx.t, {
                filter: { rideId: { equalTo: input.rideId } },
                selector: {
                    id: true,
                    file: File.ImageSelector,
                    description: true,
                    user: User.Selector,
                    createdAt: true,
                },
                orderBy: [['createdAt', 'DESC']],
            });

            return { items };
        },
    });

    public ['image/delete'] = rpc({
        input: z.object({ imageId: z.string() }),
        resolve: async ({ ctx, input }) => {
            const image = await RideImage.findByPkOrError(ctx.t, {
                pk: { id: input.imageId },
                selector: ['userId'],
            });

            if (image.userId !== ctx.user.id) {
                throw new InvalidOperationError("This image can't be deleted");
            }

            await RideImage.delete(ctx.t, {
                pk: { id: input.imageId },
            });
        },
    });
}

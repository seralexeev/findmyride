import { fileInput } from '@untype/rpc';
import { singleton } from 'tsyringe';
import { rpc } from '../rpc';
import { FileService } from './FileService';

@singleton()
export class FileController {
    public constructor(private files: FileService) {}

    public ['file/upload_image'] = rpc({
        input: fileInput,
        resolve: async ({ ctx, input }) => {
            const { file } = await this.files.upload(ctx, 'images', {
                buffer: input.buffer,
                mimeType: input.mimetype,
                meta: { originalName: input.originalname, userId: ctx.user.id },
            });

            return file;
        },
    });
}

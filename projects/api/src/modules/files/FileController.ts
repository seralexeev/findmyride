import { BadRequestError } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { rpc } from '../rpc';
import { FileService } from './FileService';

@singleton()
export class FileController {
    public constructor(private files: FileService) {}

    public ['file/upload'] = rpc({
        resolve: async ({ ctx, req }) => {
            if (!req.file) {
                throw new BadRequestError('File is required');
            }

            const { file } = await this.files.upload({
                buffer: req.file.buffer,
                mimeType: req.file.mimetype,
                meta: { originalName: req.file.originalname, userId: ctx.user.id },
            });

            return file;
        },
    });
}

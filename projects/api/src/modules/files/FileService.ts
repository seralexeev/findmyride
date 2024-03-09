import { InternalError, uuid } from '@untype/toolbox';
import { mime } from '@untype/toolbox/node';
import Axios, { AxiosRequestConfig } from 'axios';
import { encode } from 'blurhash';
import { contentType, lookup } from 'mime-types';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { singleton } from 'tsyringe';
import z from 'zod';
import { Config } from '../../config';
import { File } from '../../entities';
import { Context } from '../rpc/models';
import { S3Service } from './S3Service';
import { FileMeta } from './models';

@singleton()
export class FileService {
    private axios = Axios.create();

    public constructor(
        private s3Service: S3Service,
        private config: Config,
    ) {}

    public getFile = async (ctx: Context, id: string) => {
        const file = await File.findByPkOrError(ctx.t, {
            selector: ['id', 'url', 'key'],
            pk: { id },
        });

        const buffer = await this.s3Service.getFileBuffer(file.key);

        return { file, buffer };
    };

    public upload = async (ctx: Context<false>, directory: 'files' | 'images', args: UploadArgs) => {
        try {
            const { buffer, meta, mimeType } = await this.processFile(args);
            const id = uuid.v4();

            const key = [directory, id].join('/');

            const result = mime.isImage(mimeType)
                ? await this.uploadImage({ key, buffer, mimeType })
                : await this.uploadFile({ key, buffer, mimeType });

            return {
                buffer,
                file: await File.create(ctx.t, {
                    item: {
                        id,
                        key,
                        meta,
                        size: buffer.byteLength,
                        url: result.url,
                        bucket: this.config.storage.bucket,
                        mimeType: result.mimeType,
                        blurhash: result.blurhash,
                        width: result.width,
                        height: result.height,
                    },
                    selector: ['id', 'url'],
                }),
            };
        } catch (cause) {
            throw new InternalError('Unable to upload file', { cause, internal: args });
        }
    };

    private processFile = async (args: UploadArgs) => {
        let buffer;
        let mimeType = args.mimeType;
        const meta = args.meta ?? {};

        if ('buffer' in args) {
            buffer = args.buffer;
        } else if ('url' in args) {
            const response = await this.axios.request<Buffer>({ responseType: 'arraybuffer', ...args });
            buffer = response.data;
            mimeType ??= response.headers['content-type'];
            meta.originalUrl ??= args.url;
        } else if ('path' in args) {
            buffer = await fs.readFile(args.path);
            meta.originalPath ??= args.path;
            mimeType ??= lookup(args.path) || undefined;
        }

        if (!buffer) {
            throw new InternalError('No file buffer');
        }

        return { buffer, mimeType, meta };
    };

    private uploadFile = async ({
        buffer,
        key,
        mimeType = 'application/octet-stream',
    }: {
        buffer: Buffer;
        key: string;
        mimeType: string | undefined;
    }) => {
        const { url } = await this.s3Service.uploadFile({ key, buffer, mimeType });

        return {
            url,
            width: null,
            height: null,
            blurhash: null,
            mimeType,
        };
    };

    private uploadImage = async ({ buffer, key, mimeType }: { buffer: Buffer; key: string; mimeType: string | undefined }) => {
        const image = sharp(buffer).rotate();
        const metadata = await image.metadata();

        mimeType ??= contentType(metadata.format ?? '') || undefined;
        if (!mimeType) {
            throw new InternalError('Unable to determine image mime type');
        }

        const blurhash = await new Promise<string>((resolve, reject) => {
            image
                .raw()
                .ensureAlpha()
                .resize(32, 32, { fit: 'inside' })
                .toBuffer((error, buffer, { width, height }) => {
                    error ? reject(error) : resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
                });
        });

        const { width, height } = z.object({ width: z.number(), height: z.number() }).parse(metadata);
        const { url } = await this.s3Service.uploadFile({ key, buffer, mimeType });

        return {
            url,
            width,
            height,
            blurhash,
            mimeType,
        };
    };
}

type FileSource =
    | { buffer: Buffer }
    | { path: string }
    | (Omit<AxiosRequestConfig, 'url'> & {
          url: string;
      });

type UploadArgs = FileSource & {
    mimeType?: string;
    meta?: FileMeta;
};

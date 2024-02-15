import { Logger } from '@untype/logger';
import { Pg } from '@untype/pg';
import { InternalError, array, mime, object } from '@untype/toolbox';
import Axios, { AxiosRequestConfig } from 'axios';
import fs from 'node:fs/promises';
import sharp, { Sharp } from 'sharp';
import { singleton } from 'tsyringe';
import { v4 } from 'uuid';
import { File } from '../../entities';
import { S3Service } from './S3Service';
import { FileMeta, FileType, ImageSize, SizedImage } from './models';

type SizeConfig = { maxWidth: number; maxHeight: number; quality?: number };

type UploadArgs = {
    directory?: string;
    mimeType?: string;
    meta?: FileMeta;
} & ({ buffer: Buffer } | { url: string; config?: AxiosRequestConfig } | { path: string });

type UploadResult = {
    type: FileType;
    url: string;
    imageSizes: SizedImage | null;
    meta: Record<string, unknown> | null;
    key: string;
};

@singleton()
export class FileService {
    private axios;
    private options;

    public constructor(
        private pg: Pg,
        private logger: Logger,
        private s3Service: S3Service,
        private config: { bucket: string },
    ) {
        this.axios = Axios.create();
        this.options = {
            bucket: config.bucket,
            sizeConfig: {
                small: { maxWidth: 512, maxHeight: 512, maxQuality: 80 },
                medium: { maxWidth: 1024, maxHeight: 1024, maxQuality: 80 },
                large: { maxWidth: 3840, maxHeight: 3840, maxQuality: 80 },
            },
            defaultDirectory: 'images',
            cloudfrontUrl: undefined,
        };
    }

    public upload = async (args: UploadArgs) => {
        const directory = args.directory ?? this.options.defaultDirectory;
        if (!directory) {
            throw new InternalError('No directory specified');
        }

        try {
            const { buffer, meta: fileMeta, mimeType = await this.tryGetImageMimeType(buffer) } = await this.processFile(args);
            const id = v4();

            const { imageSizes, type, url, meta, key } = mime.isImage(mimeType)
                ? await this.resizeImageAndUpload({ id, buffer, directory })
                : await this.uploadFileImpl({ id, buffer, mimeType, directory });

            return {
                buffer,
                file: await File.create(this.pg, {
                    item: {
                        type,
                        id,
                        url,
                        bucket: this.config.bucket,
                        key,
                        mimeType,
                        imageSizes,
                        size: buffer.byteLength,
                        meta: { ...fileMeta, ...meta },
                    },
                    selector: ['id', 'url', 'imageSizes', 'meta', 'size', 'mimeType'],
                }),
            };
        } catch (cause) {
            throw new InternalError('Unable to upload file', { cause, data: args });
        }
    };

    private processFile = async (args: UploadArgs) => {
        let buffer;
        let mimeType = args.mimeType;
        const meta = args.meta ?? {};

        if ('buffer' in args) {
            buffer = args.buffer;
        } else if ('url' in args) {
            const response = await this.axios.request<Buffer>({
                responseType: 'arraybuffer',
                url: args.url,
                ...args.config,
            });
            buffer = response.data;
            mimeType ??= response.headers['content-type'];
            meta.originalUrl ??= args.url;
        } else if ('path' in args) {
            buffer = await fs.readFile(args.path);
            meta.originalPath ??= args.path;
        }

        if (!buffer) {
            throw new InternalError('No file buffer');
        }

        return { buffer, mimeType, meta };
    };

    private tryGetImageMimeType = async (buffer: Buffer) => {
        let mimeType;

        try {
            const { format } = await sharp(buffer).metadata();
            mimeType = mime.contentType(format ?? '');
        } catch (error) {
            this.logger.warn('Unable to get image mime type', { error });
        }

        return mimeType || 'application/octet-stream';
    };

    private uploadFileImpl = async ({
        id,
        buffer,
        directory,
        mimeType,
    }: {
        id: string;
        buffer: Buffer;
        directory: string;
        mimeType: string;
    }): Promise<UploadResult> => {
        const key = [directory, id].join('/');
        const { url } = await this.s3Service.uploadFile({
            key,
            data: buffer,
            mimeType,
            bucket: this.options.bucket,
        });

        return {
            type: 'file',
            url: this.options.cloudfrontUrl ? `${this.options.cloudfrontUrl}/${key}` : url,
            imageSizes: null,
            meta: null,
            key,
        };
    };

    private resizeImageAndUpload = async ({
        id,
        buffer,
        directory,
    }: {
        id: string;
        buffer: Buffer;
        directory: string;
    }): Promise<UploadResult> => {
        const stream = sharp(buffer, { animated: true });
        const key = [directory, id].join('/');

        const [original, imageSizes] = await Promise.all([
            this.uploadImageAlias({ key, config: null, stream }),
            this.uploadImageVariants(stream, key),
        ]);

        return {
            type: 'image',
            url: original.url,
            meta: { width: original.width, height: original.height },
            imageSizes,
            key,
        };
    };

    private uploadImageVariants = async (stream: Sharp, key: string) => {
        if (!this.options.sizeConfig) {
            return null;
        }

        const sizes = await Promise.all(
            Object.entries(this.options.sizeConfig).map(async ([alias, config]) => {
                const result = await this.uploadImageAlias({
                    key: [key, alias].join('/'),
                    config,
                    stream,
                });

                return {
                    alias: alias as ImageSize,
                    size: object.pick(result, ['url', 'width', 'height']),
                };
            }),
        );

        return array.reduceBy(
            sizes,
            (x) => x.alias,
            (x) => x.size,
        ) as SizedImage;
    };

    private uploadImageAlias = async ({
        key,
        config,
        stream,
    }: {
        key: string;
        stream: sharp.Sharp;
        config: SizeConfig | null;
    }) => {
        let resizedStream = stream.clone().rotate();

        if (config) {
            resizedStream = resizedStream
                .resize({
                    fit: 'inside',
                    width: config.maxWidth,
                    height: config.maxHeight,
                    withoutEnlargement: true,
                })
                .webp({ quality: config.quality });
        }

        const { data, info } = await resizedStream.toBuffer({ resolveWithObject: true });
        const mimeType = mime.contentType(info.format) || 'application/octet-stream';

        const { url } = await this.s3Service.uploadFile({
            data,
            key,
            mimeType,
            bucket: this.options.bucket,
        });

        return {
            mimeType,
            width: info.width,
            height: info.height,
            url: this.options.cloudfrontUrl ? `${this.options.cloudfrontUrl}/${key}` : url,
        };
    };
}

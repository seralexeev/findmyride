import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger as AWSLogger } from '@aws-sdk/types/dist-types/logger';
import { Logger } from '@untype/logger';
import { InternalError } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { Config } from '../../config';

@singleton()
export class S3Service {
    private client;

    public constructor(
        logger: Logger,
        private config: Config,
    ) {
        this.client = new S3Client({
            logger: new S3Logger(logger),
            endpoint: this.config.storage.endpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId: this.config.storage.credentials.accessKeyId,
                secretAccessKey: this.config.storage.credentials.secretAccessKey,
            },
        });
    }

    public uploadFile = async ({ buffer, key, mimeType }: { key: string; mimeType: string; buffer: Buffer }) => {
        try {
            const command = new PutObjectCommand({
                Bucket: this.config.storage.bucket,
                Key: key,
                ContentType: mimeType,
                Body: buffer,
            });

            await this.client.send(command);

            return {
                url: `${this.config.storage.endpoint}/${this.config.storage.bucket}/${key}`,
            };
        } catch (cause) {
            throw new InternalError('An error has occurred while uploading file', {
                internal: { key, mimeType },
                cause,
            });
        }
    };

    public getPresignedUrl = (key: string) => {
        const command = new PutObjectCommand({
            Bucket: this.config.storage.bucket,
            Key: key,
        });

        return getSignedUrl(this.client, command, {
            expiresIn: 5 * 60,
        });
    };

    public getFileBuffer = async (key: string) => {
        const command = new GetObjectCommand({
            Bucket: this.config.storage.bucket,
            Key: key,
        });

        const response = await this.client.send(command);
        const array = await response.Body?.transformToByteArray();
        if (!array) {
            throw new InternalError('Unable to transform file to byte array');
        }

        return Buffer.from(array);
    };
}

class S3Logger implements AWSLogger {
    public constructor(private logger: Logger) {}

    public debug = (content: object) => {
        this.logger.debug('S3 Client', content);
    };

    public info = (content: object) => {
        this.logger.info('S3 Client', content);
    };

    public warn = (content: object) => {
        this.logger.warn('S3 Client', content);
    };

    public error = (content: object) => {
        this.logger.error('S3 Client', content);
    };
}

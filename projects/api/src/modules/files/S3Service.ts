import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger as AWSLogger } from '@aws-sdk/types/dist-types/logger';
import { Logger } from '@untype/logger';
import { InternalError } from '@untype/toolbox';
import { singleton } from 'tsyringe';

export type S3ServiceConfig = {
    region?: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    credentials: { accessKeyId: string; secretAccessKey: string };
};

type UploadFileArgs = {
    key: string;
    mimeType: string;
    data: Buffer;
    bucket: string;
};

@singleton()
export class S3Service {
    private client;
    private forcePathStyle;

    public constructor(
        logger: Logger,
        private config?: S3ServiceConfig,
    ) {
        this.forcePathStyle = config?.forcePathStyle ?? false;
        this.client = new S3Client({ ...config, logger: new S3Logger(logger) });
    }

    public async uploadFile({ data, key, mimeType, bucket }: UploadFileArgs) {
        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: mimeType,
                Body: data,
            });

            await this.client.send(command);

            return {
                url: this.forcePathStyle
                    ? await this.buildPathStyleUrl(bucket, key)
                    : await this.buildDomainStyleUrl(bucket, key),
            };
        } catch (cause) {
            throw new InternalError('An error has occurred while uploading file', { cause });
        }
    }

    private buildDomainStyleUrl = async (bucket: string, key: string) => {
        const { hostname, port, protocol } = await this.getUrlParts();

        return `${protocol}//${bucket}.${hostname}${port}/${key}`;
    };

    private buildPathStyleUrl = async (bucket: string, key: string) => {
        const { hostname, port, protocol } = await this.getUrlParts();

        return `${protocol}//${hostname}${port}/${bucket}/${key}`;
    };

    private getUrlParts = async () => {
        const { url: endpoint } = this.client.config.endpointProvider({
            Region: await this.client.config.region(),
            Endpoint: this.config?.endpoint,
        });

        const port = endpoint.port && endpoint.port !== '433' ? `:${endpoint.port}` : '';

        return {
            port,
            protocol: endpoint.protocol,
            hostname: endpoint.hostname,
        };
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

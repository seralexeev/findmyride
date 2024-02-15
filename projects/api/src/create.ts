import { Logger } from '@untype/logger';
import { Pg } from '@untype/pg';
import { ExpressServer } from '@untype/rpc-express';
import { Container, json } from '@untype/toolbox';
import { createServer } from 'http';
import { container } from 'tsyringe';
import { Config } from './config';
import { controllers } from './controllers';
import { FileService } from './modules/files/FileService';
import { S3Service } from './modules/files/S3Service';
import { startWorker } from './worker';

class Server extends ExpressServer {
    public constructor(private logger: Logger) {
        super();
    }

    protected override serializeError = (error: unknown) => {
        this.logger.error('Error', error);

        return json.converter.convert(error);
    };
}

export const createApp = async () => {
    const config = await Config.load();
    const logger = new Logger({ ...config.logger });
    const pg = new Pg(config.pg, { applicationName: 'findmyride/api' });
    const s3Service = new S3Service(logger, config.s3);

    container.register(Logger, { useValue: logger });
    container.register(Container, { useValue: container });
    container.register(Pg, { useValue: pg });
    container.register(Config, { useValue: config });
    container.register(S3Service, { useValue: s3Service });
    container.register(FileService, { useValue: new FileService(pg, logger, s3Service, { bucket: 'findmyride' }) });

    const { app, endpoints } = new Server(logger).createServer({
        container,
        controllers,
        path: '/api',
    });

    const server = createServer(app);
    await startWorker({ container, pg, logger });

    server.listen(config.server.port, () => {
        logger.info(`🌎 Server started`, {
            port: config.server.port,
            endpoints: Object.entries(endpoints).map(([name, methods]) => `${Object.keys(methods).join(', ')} ${name}`),
        });
    });
};

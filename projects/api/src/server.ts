import { Logger } from '@untype/logger';
import { Pg } from '@untype/pg';
import { ExpressServer } from '@untype/rpc-express';
import { Container } from '@untype/toolbox';
import { json } from '@untype/toolbox/node';
import { Express } from 'express';
import http from 'node:http';
import { container } from 'tsyringe';
import { Config } from './config';
import { controllers } from './controllers';
import { startWorker } from './worker';

class Server extends ExpressServer {
    public constructor(private logger: Logger) {
        super();
    }

    protected override serializeError = (error: unknown) => {
        this.logger.error('Error', error);

        return json.converter.convert(error);
    };

    protected override onBeforeRouter = (app: Express) => {
        app.use((req, res, next) => {
            this.logger.info(`🔵 ${req.method} ${req.url}`, req.body);
            next();
        });
    };

    protected override onAfterRouter = (app: Express) => {
        app.use((req, res, next) => {
            this.logger.info(`🟣 ${res.statusCode} ${req.url}`);
            next();
        });
    };
}

export const createServer = async () => {
    const config = await Config.load();
    const logger = new Logger(config.logger);
    const pg = new Pg(config.pg, { applicationName: 'findmyride/api' });

    container.register(Logger, { useValue: logger });
    container.register(Container, { useValue: container });
    container.register(Pg, { useValue: pg });
    container.register(Config, { useValue: config });

    const { app, endpoints } = new Server(logger).createServer({
        container,
        controllers,
    });

    const server = http.createServer(app);

    const start = async () => {
        await startWorker({ container, pg, logger });

        server.listen(config.server.port, () => {
            logger.info(`🌎 Server started`, {
                port: config.server.port,
                endpoints: Object.entries(endpoints).map(([name, methods]) => `${Object.keys(methods).join(', ')} ${name}`),
            });
        });
    };

    return { start, container };
};

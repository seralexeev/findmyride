import 'reflect-metadata';
import 'source-map-support/register';

import { Logger, logger } from '@untype/logger';
import { MigrationRunner } from '@untype/migrations';
import { Pg } from '@untype/pg';
import { migrateWorker } from '@untype/worker';
import { singleton } from 'tsyringe';
import { migrations } from './migrations';

@singleton()
export class Migrations {
    private runner;

    public constructor(
        logger: Logger,
        private pg: Pg,
    ) {
        this.runner = new MigrationRunner(logger, pg);
    }

    public run = async () => {
        await migrateWorker(this.pg);
        await this.runner.run(migrations);
    };
}

if (require.main === module) {
    (async () => {
        try {
            const master = process.env.CONNECTION_STRING;
            if (!master) {
                throw new Error('CONNECTION_STRING must be set');
            }

            const pg = new Pg(master);
            await new Migrations(logger, pg).run();

            process.exit(0);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    })();
}

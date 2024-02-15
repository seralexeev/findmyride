import { DefaultLogger } from '@untype/logger';
import { MigrationRunner } from '@untype/migrations';
import { Pg } from '@untype/pg';
import { LoggerType } from '@untype/toolbox';
import { migrations } from './migrations';

export class Migrations {
    private runner;

    public constructor(logger: LoggerType, pg: Pg) {
        this.runner = new MigrationRunner(logger, pg);
    }

    public run = () => {
        return this.runner.run(migrations);
    };

    public static apply = async () => {
        const master = process.env.CONNECTION_STRING;
        if (!master) {
            throw new Error('CONNECTION_STRING must be set');
        }

        const pg = new Pg(master);
        await new Migrations(DefaultLogger, pg).run();

        process.exit(0);
    };
}

if (require.main === module) {
    Migrations.apply().catch(() => process.exit(1));
}

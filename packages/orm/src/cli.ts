import { program } from 'commander';
import { generateEntities } from './generator';

program.name('untype-orm').description('CLI to work with ORM');

program
    .command('generate <directory>')
    .description('inspect database and generate entities')
    .requiredOption('-c, --connectionString <connectionString>', 'connection string')
    .option('-s, --schema <schema>', 'schema', 'public')
    .action(async (directory, options) => {
        return generateEntities({
            directory,
            schemaName: options.schema,
            connectionString: options.connectionString,
        });
    });

export const run = (args: string[]) => program.parse(args);

if (require.main === module) {
    run(process.argv);
}

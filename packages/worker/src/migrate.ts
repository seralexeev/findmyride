import { Pg } from '@untype/pg';
import { runMigrations } from 'graphile-worker';

export const migrateWorker = async (pg: Pg) => runMigrations({ pgPool: pg.master.pool });

import { Pg } from '@untype/pg';
import { makeWorkerUtils } from 'graphile-worker';

export const createWorkerUtils = (pg: Pg) => {
    return makeWorkerUtils({ pgPool: pg.master.pool });
};

import { ActionDef } from '../models/actions';
import { RpcEndpoint } from '../rpc';

export type PassiveActions = ActionDef<'@app/REFRESH_QUERIES', { queries: RpcEndpoint[] }>;

export const refreshQueriesAction = (queries: RpcEndpoint[]) => {
    return {
        type: '@app/REFRESH_QUERIES',
        payload: { queries },
    };
};

import type { Api } from '@findmyride/api';
import { createRpcHook } from '@untype/rpc-react';

export const { useRpc, useInvalidate, useResetQuery, useRemoveQuery } = createRpcHook<Api>({
    path: '',
});

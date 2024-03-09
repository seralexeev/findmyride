import { InferRpcEndpoint, InferRpcInput, InferRpcOutput, RpcApi, createEndpointFactory } from '@untype/rpc';
import { controllers } from '../../controllers';
import { ApiExecutor } from './ApiExecutor';

export type Api = RpcApi<typeof controllers>;
export type RpcEndpoint = InferRpcEndpoint<Api>;
export type RpcOutput<T extends RpcEndpoint> = InferRpcOutput<Api, T>;
export type RpcItemsOutput<TMethod extends RpcEndpoint> = RpcOutput<TMethod> extends { items: Array<infer A> } ? A : never;
export type RpcInput<T extends RpcEndpoint> = InferRpcInput<Api, T>;

export type ExpectedEndpoint<TInput, TOutput> = {
    [TKey in RpcEndpoint]: RpcInput<TKey> extends never
        ? never
        : RpcInput<TKey> extends TInput
          ? RpcOutput<TKey> extends TOutput
              ? TKey
              : never
          : never;
}[RpcEndpoint];

export type SelectRpcEndpoint<T extends RpcEndpoint> = T;

export const { rpc, rest } = createEndpointFactory(ApiExecutor);

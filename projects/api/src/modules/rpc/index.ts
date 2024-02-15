import { InferRpcEndpoint, InferRpcInput, InferRpcOutput, RpcApi, createEndpointFactory } from '@untype/rpc';
import { controllers } from '../../controllers';
import { ApiExecutor } from './ApiExecutor';

export type Api = RpcApi<typeof controllers>;
export type RpcEndpoint = InferRpcEndpoint<Api>;
export type RpcOutput<T extends RpcEndpoint> = InferRpcOutput<Api, T>;
export type RpcItemsOutput<TMethod extends RpcEndpoint> = RpcOutput<TMethod> extends { items: Array<infer A> } ? A : never;
export type RpcInput<T extends RpcEndpoint> = InferRpcInput<Api, T>;
export type ListEndpoint = ExpectedEndpoint<{ items: unknown[]; total: number }>;

export type ExpectedEndpoint<TOutput> = {
    [E in RpcEndpoint]: [RpcOutput<E>] extends [never] ? never : RpcOutput<E> extends TOutput ? E : never;
}[RpcEndpoint];

export const { rpc, rest } = createEndpointFactory(ApiExecutor);

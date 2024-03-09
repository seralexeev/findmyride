import * as rq from '@tanstack/react-query';
import { assert } from '@untype/toolbox';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAxios } from './AxiosProvider';

export const createRpcHook = <T extends Record<string, { input?: any; output?: any }>>({ path }: { path: string }) => {
    const useRpc = <M extends keyof T & string>(method: M, axiosInstance?: AxiosInstance) => {
        type TInput = T[M]['input'];
        type TOutput = T[M]['output'];

        type QueryOptions = Omit<rq.UseQueryOptions<TOutput, unknown, TOutput>, 'queryKey' | 'queryFn'>;
        type MutationOptions = Omit<rq.UseMutationOptions<TOutput, unknown, TOutput>, 'mutationKey' | 'mutationFn'> & {
            invalidates?: Array<keyof T>;
        };

        type QueryResult = rq.UseQueryResult<TOutput>;

        type MutationResult = [
            mutate: (input: T[M] extends { input: any } ? TInput : null) => Promise<TOutput>,
            options: { isLoading: boolean; error?: unknown },
        ];

        type UseQuery = T[M] extends { input: any }
            ? (options: QueryOptions & { input: TInput | (() => TInput) }) => QueryResult
            : (options?: QueryOptions) => QueryResult;

        type UseMutation = (options?: MutationOptions) => MutationResult;

        const queryClient = rq.useQueryClient();

        const { axios: contextAxios } = useAxios();
        const axios = axiosInstance ?? contextAxios;

        const useQuery: UseQuery = ({ input, ...options }: any = {}) => {
            if (typeof input === 'function') {
                input = assert.noexept(input);
            }

            const hook: any = rq.useQuery({
                queryKey: [method, input],
                queryFn: async ({ signal }) => {
                    return axios.post<TOutput>(`${path}/${method}`, input, { signal }).then((res) => res.data);
                },
                ...options,
            });

            return hook;
        };

        const useMutation: UseMutation = ({ invalidates, ...options }: any = {}) => {
            const { mutateAsync, error, isPending } = rq.useMutation({
                mutationKey: [method],
                mutationFn: async ({ input }: any) => {
                    const config: AxiosRequestConfig = {
                        url: `${path}/${method}`,
                        method: 'post',
                        data: input,
                        headers: {},
                    };

                    if (input instanceof FormData) {
                        config.headers = { 'Content-Type': 'multipart/form-data' };
                        config.data = input;
                    } else if (input instanceof File) {
                        const formData = new FormData();
                        formData.append('file', input);
                        config.headers = { 'Content-Type': 'multipart/form-data' };
                        config.data = formData;
                    } else {
                        config.data = input;
                    }

                    return axios(config).then(async (res) => {
                        if (invalidates) {
                            await Promise.all(invalidates.map((x: string) => queryClient.invalidateQueries({ queryKey: [x] })));
                        }

                        return res.data;
                    });
                },
                ...options,
            });

            return [async (input: any) => mutateAsync({ input } as any), { isLoading: isPending, error }];
        };

        return {
            useQuery,
            useMutation,
            invalidate: () => queryClient.invalidateQueries({ queryKey: [method] }),
            useRequest: () => {
                return (input: TInput) => {
                    return axios.post<TOutput>(`${path}/${method}`, input).then((res) => res.data);
                };
            },
        };
    };

    const useInvalidate = () => {
        const queryClient = rq.useQueryClient();

        return (queries: Array<keyof T>) => Promise.all(queries.map((x) => queryClient.invalidateQueries({ queryKey: [x] })));
    };

    const useRemoveQuery = () => {
        const queryClient = rq.useQueryClient();

        return (queries: Array<keyof T>) => Promise.all(queries.map((x) => queryClient.removeQueries({ queryKey: [x] })));
    };

    const useResetQuery = () => {
        const queryClient = rq.useQueryClient();

        return (queries: Array<keyof T>) => Promise.all(queries.map((x) => queryClient.resetQueries({ queryKey: [x] })));
    };

    return { useRpc, useInvalidate, useResetQuery, useRemoveQuery };
};

import { Pg, SqlClient, Transaction } from '@untype/pg';
import { ContainerType, InternalError, Lazy, LoggerType, Merge, OmitNever, lazy } from '@untype/toolbox';
import { json } from '@untype/toolbox/node';
import {
    CronItem,
    CronItemOptions,
    JobHelpers,
    TaskSpec as LibTaskSpec,
    Logger,
    RunnerOptions,
    SharedOptions,
    Task,
    TaskList,
    parseCronItems,
    run,
    runMigrations,
} from 'graphile-worker';
import { makeAddJob } from 'graphile-worker/dist/helpers';
import { CompiledSharedOptions, processSharedOptions } from 'graphile-worker/dist/lib';
import { Class } from 'type-fest';
import { z } from 'zod';
import { UnrecoverableWorkerError } from './errors';

type Context = { helper: JobHelpers; t: Transaction };

class TaskHandler<T> {
    public constructor(
        public config: {
            pattern?: string;
            enabled?: () => boolean;
            input?: z.ZodType<T>;
            cronOptions?: CronItemOptions;
            resolve: (args: { input?: unknown } & Context) => Promise<void> | void;
        },
    ) {}
}

type TaskConfig<TArgs = {}> = {
    resolve: (args: Context & TArgs) => Promise<void> | void;
};

export function task<TInput>(config: TaskConfig<{ input: TInput }> & { input: z.ZodType<TInput> }): TaskHandler<TInput>;
export function task(config: TaskConfig): TaskHandler<never>;
export function task(config: any): any {
    return new TaskHandler(config);
}

type CronConfig<TArgs> = {
    resolve: (args: TArgs) => Promise<void> | void;
    pattern: string;
    cronOptions?: CronItemOptions;
    enabled?: () => boolean;
};

export function cron(config: CronConfig<Context>): TaskHandler<never> {
    return new TaskHandler(config);
}

export type WorkerConfig = {
    concurrency?: number;
    cron?: { disabled?: boolean };
    forbiddenFlags?: string[];
};

type TaskSpec = Omit<LibTaskSpec, 'jobKey'> & {
    jobKey?: string | number | true;
};

export const createWorker = <T extends Record<string, Class<any>>>(handlers: () => T) => {
    let sharedOptions: Lazy<CompiledSharedOptions<SharedOptions>>;

    const schedule = async (
        client: SqlClient,
        job: WorkerHandlerCollection<T>[keyof WorkerHandlerCollection<T>] & { key: string },
        { jobKey, ...spec }: TaskSpec = {},
    ) => {
        const addJob = makeAddJob(sharedOptions(), client.connect);

        if (jobKey === true) {
            jobKey = job.key;
        } else if (jobKey !== undefined) {
            jobKey = [job, jobKey].join('/');
        }

        await addJob(job.key, job.input as any, { ...spec, jobKey });
    };

    const startWorker = async ({
        pg,
        container,
        logger,
        config = {},
    }: {
        pg: Pg;
        container: ContainerType;
        logger: LoggerType;
        config?: WorkerConfig;
    }) => {
        const { concurrency } = config;
        const instances = Object.values(handlers()).map((x) => container.resolve(x) as Record<string, unknown>);
        const taskList: TaskList = {};
        const croneItems: CronItem[] = [];

        for (const instance of instances) {
            for (const [name, value] of Object.entries(instance)) {
                if (!(value instanceof TaskHandler)) {
                    continue;
                }

                if (name in taskList) {
                    throw new InternalError(`The worker has registered already: ${name}`);
                }

                const { resolve, input: inputShape, pattern, cronOptions, enabled } = value.config;

                const task: Task = async (payload, helper) => {
                    logger.info(`Executing job ${name}`, { name, payload });

                    let input: unknown;
                    if (inputShape) {
                        const inputParsed = inputShape.safeParse(payload);
                        if (!inputParsed.success) {
                            const cause = inputParsed.error;
                            Object.defineProperty(cause, 'message', { get: () => 'Parse Error' });
                            throw new InternalError('Validation Error', { cause });
                        }

                        input = inputParsed.data;
                    }

                    await pg.transaction(async (t) => {
                        try {
                            await resolve({ t, input, helper });
                        } catch (error) {
                            if (error instanceof UnrecoverableWorkerError) {
                                logger.error('Excluding the job from queue as the error is not recoverable', {
                                    error,
                                    name,
                                    payload,
                                });
                            } else {
                                logger.error('Unable to handle worker action', { error, name, payload });
                                throw new VerboseError(JSON.stringify(json.converter.convert(error)));
                            }
                        }
                    });
                };

                taskList[name] = task;

                if (config.cron?.disabled !== true && pattern) {
                    if (enabled && !enabled()) {
                        logger.info(`Job ${name} skipped due to enabled function`, { name });
                        continue;
                    }

                    croneItems.push({ match: pattern, task: name, options: cronOptions });
                }
            }
        }

        const options: RunnerOptions = {
            pgPool: pg.master.pool,
            logger: new Logger((scope) => (level, message, meta) => {
                if (message.startsWith('Worker connected and looking for jobs')) {
                    return;
                }

                const logLevel = level === 'warning' ? 'warn' : level;
                if (level !== 'debug') {
                    logger[logLevel](message, { meta, scope });
                }
            }),
            parsedCronItems: parseCronItems(croneItems),
            taskList,
            concurrency,
        };

        sharedOptions = lazy(() => processSharedOptions(options));

        await runMigrations(options);
        await run(options);

        logger.info('Worker connected and looking for jobs', {
            tasks: Object.keys(taskList),
            config: Object.keys(config).length > 0 ? config : undefined,
        });
    };

    return {
        schedule,
        startWorker,
    };
};

export class VerboseError extends Error {
    public constructor(public error: string) {
        super(JSON.stringify(error));

        this.name = 'VerboseError';
    }
}

type WorkerHandler<T> = {
    [K in keyof T]: T[K] extends TaskHandler<infer Q> ? ([Q] extends [never] ? { key: K } : { key: K; input: Q }) : never;
};

export type WorkerHandlerCollection<T> = OmitNever<
    Merge<{ [K in keyof T]: T[K] extends Class<any> ? WorkerHandler<InstanceType<T[K]>> : never }[keyof T]>
>;

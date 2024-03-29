import { Class } from '@untype/toolbox';
import { unflatten } from 'flat';
import { z } from 'zod';
import { ConfigLoader } from './loader';
import { BaseConfig, InferConfig } from './types';
import { getStringPreprocessor } from './zod';

export const createConfig = <TConfig extends BaseConfig<TConfig>>(shape: TConfig, loaders?: ConfigLoader[]) => {
    type ConfigType = InferConfig<TConfig>;

    const load = async () => {
        const flattenShape = flattenSchema(shape, ':');
        const configs = await Promise.all((loaders ?? []).map((loader) => loader.load())).then((x) => x.reverse());
        const config: Record<string, unknown> = {};

        for (const [key, schema] of Object.entries(flattenShape)) {
            const value = configs.find((x) => key in x)?.[key];

            const parsedValue = schema.safeParse(value);
            if (!parsedValue.success) {
                throw new Error(`Unable to parse config value for '${key}'. Received value '${value}'`);
            }

            config[key] = parsedValue.data;
        }

        return unflatten(config, { delimiter: ':' }) as ConfigType;
    };

    return class {
        public static load = load;

        private constructor() {
            throw new Error(`This class is not meant to be instantiated, use Config.load() instead.`);
        }
    } as any as Class<ConfigType> & {
        load: typeof load;
    };
};

export const flattenSchema = (
    config: Record<string, unknown>,
    separator: string,
    path: string = '',
    items: Record<string, z.ZodType> = {},
) => {
    for (const [key, value] of Object.entries(config)) {
        const fullPath = path ? path + separator + key : key;

        if (value instanceof z.ZodType) {
            items[fullPath] = z.preprocess(getStringPreprocessor(value) as (arg: unknown) => unknown, value);
        } else {
            flattenSchema(value as Record<string, unknown>, separator, fullPath, items);
        }
    }

    return items;
};

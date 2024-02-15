import { EnvLoader, FileLoader, createConfig } from '@untype/config';
import { shape } from './default';
import { local } from './env/local';
import { prod } from './env/prod';

export class Config extends createConfig(shape, [
    new FileLoader(process.env.FINDMYRIDE__env, { local, prod }),
    new EnvLoader('FINDMYRIDE__', process.env),
]) {}

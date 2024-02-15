import { types } from 'util';
import { ZodError } from 'zod';
import { cleanStack } from './error';
import { findObjectKeys } from './object';
import { isPromise } from './promise';

type Key = keyof any;

export class JsonConverter {
    public constructor(private options: { basePath: string }) {}

    public convert = (obj: unknown): unknown => {
        return this.convertImpl(new Set(), obj);
    };

    public stringify = (obj: unknown, replacer?: (number | string)[] | null, space?: string | number): string => {
        return JSON.stringify(this.convert(obj), replacer, space);
    };

    protected findObjectKeys(obj: object): Set<Key> | Key[] {
        return findObjectKeys(obj);
    }

    protected isFieldConvertible(key: Key): boolean {
        return true;
    }

    protected isFieldSensitive(key: Key): boolean {
        return false;
    }

    protected convertImpl(seen: Set<unknown>, obj: unknown): unknown {
        if (obj == null) {
            return obj;
        }

        if (seen.has(obj)) {
            return '[Circular]';
        }

        switch (true) {
            case typeof obj === 'boolean':
            case typeof obj === 'string':
            case typeof obj === 'number':
            case typeof obj === 'bigint':
                return obj;
            case typeof obj === 'symbol':
                return this.convertSymbol(obj);
            case typeof obj === 'function':
                return this.convertFunction(obj);
            case typeof obj !== 'object':
                return String(obj);
            case types.isDate(obj):
                return this.convertDate(obj);
            case types.isRegExp(obj):
                return this.convertRegExp(obj);
        }

        // potentially circular reference
        seen.add(obj);

        switch (true) {
            case this.implementsToJSON(obj):
                return this.try(() => this.convertImpl(seen, obj.toJSON()));
            case types.isProxy(obj):
                return this.convertProxy(obj);
            case types.isAnyArrayBuffer(obj):
                return this.convertBuffer(obj);
            case types.isArrayBufferView(obj):
                return this.convertArrayBufferView(obj);
            case Array.isArray(obj):
                return this.convertArray(seen, obj);
            case types.isMap(obj):
                return this.convertMap(seen, obj);
            case types.isSet(obj):
                return this.convertSet(seen, obj);
            case 'pipe' in obj && typeof obj.pipe === 'function':
                return this.convertStream(obj);
            case isPromise(obj):
                return this.convertPromise(obj);
            case types.isNativeError(obj):
                return this.convertError(seen, obj);
            default:
                return this.convertObject(seen, obj);
        }
    }

    protected convertObject(seen: Set<unknown>, obj: object) {
        const record: Record<string, unknown> = {};

        for (let key of this.findObjectKeys(obj)) {
            key = String(key);

            if (!this.isFieldConvertible(key)) {
                continue;
            }

            if (this.isFieldSensitive(key)) {
                record[String(key)] = '***';
                continue;
            }

            record[String(key)] = this.try(() => this.convertImpl(seen, (obj as Record<string, unknown>)[String(key)]));
        }

        return record;
    }

    protected convertArray(seen: Set<unknown>, array: unknown[]): unknown {
        return array.map((value) => this.convertImpl(seen, value));
    }

    protected convertRegExp(regexp: RegExp): unknown {
        return `[object RegExp(${String(regexp)})]`;
    }

    protected convertSymbol(obj: symbol): unknown {
        return `[object Symbol(${String(obj)})]`;
    }

    protected convertBuffer(buffer: ArrayBufferLike) {
        return '[object Buffer]';
    }

    protected convertProxy(proxy: object): unknown {
        return '[object Proxy]';
    }

    protected convertFunction(obj: Function): unknown {
        return `[object Function(${obj.name})]`;
    }

    protected convertDate(obj: Date): unknown {
        return obj.toISOString();
    }

    protected convertPromise(obj: Promise<unknown>): unknown {
        return '[object Promise]';
    }

    protected convertMap(seen: Set<unknown>, obj: Map<unknown, unknown>): unknown {
        const map: Record<string, unknown> = {};
        for (const [key, value] of obj) {
            map[String(key)] = this.convertImpl(seen, value);
        }

        return map;
    }

    protected convertSet(seen: Set<unknown>, set: Set<unknown>): unknown {
        return Array.from(set, (value) => this.convertImpl(seen, value));
    }

    protected convertArrayBufferView(obj: ArrayBufferView): unknown {
        return `[${obj.constructor.name}]`;
    }

    protected convertStream(stream: { pipe?: unknown }): unknown {
        return '[object Stream]';
    }

    protected convertError(seen: Set<unknown>, error: Error): unknown {
        if (error.stack) {
            error.stack = cleanStack(error.stack, {
                pretty: true,
                basePath: this.options.basePath + '/',
            });
        }

        return this.convertObject(seen, error);
    }

    protected implementsToJSON(obj: object): obj is { toJSON: () => void } {
        return typeof obj === 'object' && 'toJSON' in obj && typeof obj.toJSON === 'function';
    }

    protected try = <T>(fn: () => T) => {
        try {
            return fn();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return `[Thrown an error: ${message}]`;
        }
    };
}

export class PragmaticJsonConverter extends JsonConverter {
    protected override isFieldConvertible(key: Key) {
        switch (true) {
            case typeof key === 'string' && key.startsWith('_'):
            case key === '__defineGetter__':
            case key === '__defineSetter__':
            case key === '__lookupGetter__':
            case key === '__lookupSetter__':
            case key === '__proto__':
            case key === 'constructor':
            case key === 'hasOwnProperty':
            case key === 'isPrototypeOf':
            case key === 'propertyIsEnumerable':
            case key === 'toLocaleString':
            case key === 'toString':
            case key === 'valueOf':
            case key === 'toJSON':
                return false;
            default:
                return true;
        }
    }

    protected override convertArray(seen: Set<unknown>, array: unknown[]) {
        const isLongArray = array.length > 32;
        const arrayToDump = isLongArray
            ? [...array.slice(0, 16), '...truncated', ...array.slice(array.length - 16, array.length)]
            : array;

        return super.convertArray(seen, arrayToDump);
    }

    protected override convertError(seen: Set<unknown>, error: Error) {
        if (error instanceof ZodError) {
            error = Object.defineProperty(error, 'message', {
                get: () => error.name,
                configurable: true,
            });
        }

        return super.convertError(seen, error);
    }

    protected override convertFunction(obj: Function) {
        return undefined;
    }

    protected override implementsToJSON(obj: object): obj is { toJSON: () => void } {
        return false;
    }
}

export const converter = new PragmaticJsonConverter({ basePath: process.cwd() });

export class UnreachableError extends Error {
    public constructor(
        public value: never,
        message?: string,
    ) {
        super(`${message ?? 'Unreachable code reached'} (${value})`);
    }
}

type Options = {
    cause?: unknown;
    internal?: unknown;
    public?: { message?: string; data?: unknown };
};

export class InternalError extends Error {
    public public;
    public internal;

    public constructor(message: string, options?: Options) {
        super(message, {
            cause: options?.cause as Error,
        });

        this.public = options?.public;
        this.internal = options?.internal;
    }

    public shouldLog() {
        return true;
    }

    public get code() {
        return 500;
    }

    public get type() {
        return this.constructor.name;
    }
}

export class InvalidOperationError extends InternalError {
    public override get code() {
        return 400;
    }
}

export class BadRequestError extends InternalError {
    public override get code() {
        return 400;
    }
}

export class NotFoundError extends InternalError {
    public override get code() {
        return 400;
    }

    public static throw(message: string = 'Not Found', options?: Options) {
        throw new NotFoundError(message, options);
    }
}

export class UnauthorizedError extends InternalError {
    public override get code() {
        return 401;
    }

    public override shouldLog() {
        return false;
    }
}

export class ForbiddenError extends InternalError {
    public override get code() {
        return 400;
    }
}

// https://github.com/sindresorhus/escape-string-regexp
const escapeStringRegexp = (string: string) => {
    if (typeof string !== 'string') {
        throw new TypeError('Expected a string');
    }

    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
    return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};

// https://github.com/sindresorhus/clean-stack
const extractPathRegex = /\s+at.*[(\s](.*)\)?/;
const pathRegex =
    /^(?:(?:(?:node|node:[\w/]+|(?:(?:node:)?internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)(?:\.js)?:\d+:\d+)|native)/;

export const cleanStack = (
    stack: string,
    options: {
        pretty?: boolean;
        basePath?: string;
        pathFilter?: (path: string) => boolean;
        homeDirectory?: string;
    },
) => {
    const { pretty, basePath, pathFilter, homeDirectory } = options;
    const basePathRegex = basePath && new RegExp(`(file://)?${escapeStringRegexp(basePath.replace(/\\/g, '/'))}/?`, 'g');

    if (typeof stack !== 'string') {
        return undefined;
    }

    return stack
        .replace(/\\/g, '/')
        .split('\n')
        .filter((line) => {
            const pathMatches = line.match(extractPathRegex);
            if (pathMatches === null || !pathMatches[1]) {
                return true;
            }

            const match = pathMatches[1];

            // Electron
            if (
                match.includes('.app/Contents/Resources/electron.asar') ||
                match.includes('.app/Contents/Resources/default_app.asar') ||
                match.includes('node_modules/electron/dist/resources/electron.asar') ||
                match.includes('node_modules/electron/dist/resources/default_app.asar')
            ) {
                return false;
            }

            return pathFilter ? !pathRegex.test(match) && pathFilter(match) : !pathRegex.test(match);
        })
        .filter((line) => line.trim() !== '')
        .map((line) => {
            if (basePathRegex) {
                line = line.replace(basePathRegex, '');
            }

            if (pretty) {
                line = line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDirectory, '~')));
            }

            return line;
        })
        .join('\n');
};

export type LoggerType = {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
};

export class ConsoleLogger implements LoggerType {
    public static Instance = new ConsoleLogger();

    public debug = (message: string, data?: unknown) => console.debug(message, data);
    public info = (message: string, data?: unknown) => console.info(message, data);
    public warn = (message: string, data?: unknown) => console.warn(message, data);
    public error = (message: string, data?: unknown) => console.error(message, data);
}

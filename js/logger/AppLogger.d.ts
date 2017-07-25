export declare enum LogLevel {
    Silly = 0,
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}
export interface Logger {
    enable(enabled: boolean): void;
    setAppId(appId: string): void;
    setLevel(level: LogLevel): void;
    setPretty(pretty: Boolean): void;
    setStream(stream: {
        write: Function;
    }): void;
    generateRequestId(): string;
    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    info(message: string, id?: string, tags?: string[], details?: any): void;
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    error(message: string, id?: string, tags?: string[], details?: any): void;
}
export interface RequestLogger {
    silly(message: string, tags?: string[], details?: any): void;
    verbose(message: string, tags?: string[], details?: any): void;
    info(message: string, tags?: string[], details?: any): void;
    warn(message: string, tags?: string[], details?: any): void;
    error(message: string, tags?: string[], details?: any): void;
}
export declare class AppLogger implements Logger {
    private stream;
    private enabled;
    private appId;
    private level;
    private pretty;
    constructor(appId: string, level?: LogLevel, stream?: {
        write: Function;
    });
    private getLogLevel(level);
    private colorizeLevel(level);
    enable(enabled: boolean): void;
    setAppId(appId: string): void;
    getAppId(): string;
    generateRequestId(): string;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    setPretty(pretty: boolean): void;
    setStream(stream: {
        write: Function;
    }): void;
    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    info(message: string, id?: string, tags?: string[], details?: any): void;
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    error(message: string, id?: string, tags?: string[], details?: any): void;
    getRequestLogger(requestId: string): RequestLogger;
}

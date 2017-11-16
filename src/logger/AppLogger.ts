import { Color, generateRequestId } from './Common';
import { BaseLog } from './BaseLog';

export enum LogLevel {
    Silly = 0,
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4
}

const logLevelFunctions: string[] = Object.keys(LogLevel).map(k => (<any> LogLevel)[k])
    .filter(v => typeof v === 'string')
    .map((k) => k.toLowerCase());

export interface Logger {
    enable(enabled: boolean): void;
    setAppId(appId: string): void;
    setLevel(level: LogLevel): void;
    setPretty(pretty: Boolean): void;
    setStream(stream: {write: Function}): void;
    generateRequestId(): string;

    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    info(message: string, id?: string, tags?: string[], details?: any): void;
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    error(message: string, id?: string, tags?: string[], details?: any): void;

    getRequestLogger(requestId: string): RequestLogger;
}

export interface RequestLogger {
    silly(message: string, tags?: string[], details?: any): void;
    verbose(message: string, tags?: string[], details?: any): void;
    info(message: string, tags?: string[], details?: any): void;
    warn(message: string, tags?: string[], details?: any): void;
    error(message: string, tags?: string[], details?: any): void;
}

export class AppLogger implements Logger {

    private stream: {write: Function};
    private enabled: boolean = true;
    private appId: string;
    private level: LogLevel;
    private pretty: boolean = false;

    public constructor(appId: string, level: LogLevel = LogLevel.Info, stream: {write: Function} = process.stderr) {
        this.appId = appId;
        this.level = level;
        this.stream = stream;
    }

    private getLogLevel(level: LogLevel): string {
        return typeof LogLevel[level] === 'string' ? LogLevel[level].toLowerCase() : 'log';
    }

    private colorizeLevel(level: LogLevel): string {
        let color: Color = null;
        switch (level) {
            case LogLevel.Error : color = Color.red; break;
            case LogLevel.Warn : color = Color.yellow; break;
            case LogLevel.Info : color = Color.green; break;
            case LogLevel.Verbose : color = Color.blue; break;
            case LogLevel.Silly : color = Color.cyan; break;
            default: color = 0; break;
        }

        return `\x1B[${color}m${this.getLogLevel(level)}\x1B[0m`;
    }

    public enable(enabled: boolean): void {
        this.enabled = enabled;
    }

    public setAppId(appId: string): void {
        this.appId = appId;
    }

    public getAppId(): string {
        return this.appId;
    }

    public generateRequestId(): string {
        return generateRequestId();
    }

    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    public getLevel(): LogLevel {
        return this.level;
    }

    public setPretty(pretty: boolean): void {
        this.pretty = pretty;
    }

    public setStream(stream: {write: Function}): void {
        this.stream = stream;
        this.enable(true);
    }

    public log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void {

        if (this.enabled !== true || this.level === undefined || level < this.level) {
            return;
        }

        const log = new BaseLog(this.appId);
        log.reqId = id || this.generateRequestId();
        log.level = this.getLogLevel(level);
        log.message = message;
        log.tags = tags || [];

        if (typeof details === 'string') {
            details = { string: details };
        }

        log.details = details || {};

        if (this.pretty) {
            const result = JSON.stringify(log, null, 4).replace(/"level": "([^"]*)"/g, `"level": "${this.colorizeLevel(level)}"`);
            this.stream.write(`${result}\n`);
        } else {
            this.stream.write(JSON.stringify(log) + '\n');
        }
    }

    public silly(message: string, id?: string, tags?: string[], details?: any): void {
        this.log(LogLevel.Silly, message, id, tags, details);
    }

    public verbose(message: string, id?: string, tags?: string[], details?: any): void {
        this.log(LogLevel.Verbose, message, id, tags, details);
    }

    public info(message: string, id?: string, tags?: string[], details?: any): void {
        this.log(LogLevel.Info, message, id, tags, details);
    }

    public warn(message: string, id?: string, tags?: string[], details?: any): void {
        this.log(LogLevel.Warn, message, id, tags, details);
    }

    public error(message: string, id?: string, tags?: string[], details?: any): void {
        this.log(LogLevel.Error, message, id, tags, details);
    }

    public getRequestLogger(requestId: string): RequestLogger {
        const logger: any = {};

        for (const logFunction of logLevelFunctions) {
            logger[logFunction] = (message: string, tags?: string[], details?: any) => {
                (<any> this)[logFunction].call(this, message, requestId, tags, details);
            };
        }

        return logger;
    }
}

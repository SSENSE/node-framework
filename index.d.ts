/// <reference types="node" />
/// <reference types="mongoose" />
/// <reference types="mongoose-paginate" />
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Document as MongooseDocument, Schema as MongooseSchema, PaginateModel as MongoosePaginateModel } from 'mongoose';

//////////////////
// Logger utils //
//////////////////

// AccessLogger
export interface UserIdCallback {
    (req: IncomingMessage, res: ServerResponse): string;
}

export class AccessLogger {
    /**
     * AccessLogger constructor
     * @param appId Application id
     */
    constructor(appId: string);
    /**
     * Enable or disable AccessLogger (enabled by default)
     * @param enabled Set to false to disable
     */
    enable(enabled: boolean): void;
    /**
     * Enable pretty logs (disabled by default)
     * @param pretty Set to true to enable pretty logs (colorized and multilines)
     */
    setPretty(pretty: boolean): void;
    /**
     * Set logger output stream and enables it (default stream: process.stdout)
     * @param stream Stream (file, stdout...) where the logs will be rendered
     */
    setStream(stream: {write: Function}): void;
    /**
     * Set application id
     * @param appId Application id, useful to override the default one used in constructor
     */
    setAppId(appId: string): void;
    /**
     * Set user id callbacl
     * @param callback Function that should return a user id (string) based on http request and response
     */
    setUserIdCallback(callback: UserIdCallback): void;
    /**
     * Log an HTTP request
     * @param req HTTP request
     * @param res HTTP response
     * @param next Next function called (in case of middleware use)
     */
    logRequest(req: IncomingMessage, res: ServerResponse, next?: Function): void;
}

// AppLogger related interfaces and data
export enum LogLevel {
    Silly = 0,
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4
}

export interface Logger {
    /**
     * Enable or disable Logger
     * @param enabled Set false to disable
     */
    enable(enabled: boolean): void;
    /**
     * Set application id
     * @param appId Application id
     */
    setAppId(appId: string): void;
    /**
     * Set logger minimum level
     * @param level Logger level, all logs below this level will be ignored
     */
    setLevel(level: LogLevel): void;
    /**
     * Enable pretty logs
     * @param pretty Set to true to enable pretty logs (colorized and multilines)
     */
    setPretty(pretty: Boolean): void;
    /**
     * Set logger output stream and enables it
     * @param stream Stream (file, stdout...) where the logs will be rendered
     */
    setStream(stream: {write: Function}): void;
    /**
     * Generate a new request id, random string based on GUID format
     */
    generateRequestId(): string;
    /**
     * Write a log
     * @param level Level used for current log
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Silly level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Verbose level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Info level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    info(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Warn level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Error level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    error(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Returns a logger on which all log methods will use the same request id
     * Useful to include in an HTTP request object, to be able to log the whole request process
     * with one unique id and follow it easily in your logs
     * @param requestId Unique id
     */
    getRequestLogger(requestId: string): RequestLogger;
}

export interface RequestLogger {
    /**
     * Write a log with LogLevel.Silly level
     * @param message Message to log
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    silly(message: string, tags?: string[], details?: any): void;
    /**
     * Write a log with LogLevel.Verbose level
     * @param message Message to log
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    verbose(message: string, tags?: string[], details?: any): void;
    /**
     * Write a log with LogLevel.Info level
     * @param message Message to log
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    info(message: string, tags?: string[], details?: any): void;
    /**
     * Write a log with LogLevel.Warn level
     * @param message Message to log
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    warn(message: string, tags?: string[], details?: any): void;
    /**
     * Write a log with LogLevel.Error level
     * @param message Message to log
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    error(message: string, tags?: string[], details?: any): void;
}

// AppLogger
export class AppLogger implements Logger {
    /**
     * AppLogger constructor
     * @param appId Application id
     * @param level Logger minimum level (default: LogLevel.Info), all logs below this level will be ignored
     * @param stream Logger output stream (default: process.stderr)
     */
    constructor(appId: string, level?: LogLevel, stream?: {write: Function});
    /**
     * Enable or disable AppLogger (enabled by default)
     * @param enabled Set false to disable
     */
    enable(enabled: boolean): void;
    /**
     * Set application id
     * @param appId Application id, useful to override the default one used in constructor
     */
    setAppId(appId: string): void;
    /**
     * Get application id
     */
    getAppId(): string;
    /**
     * Generate a new request id, random string based on GUID format
     */
    generateRequestId(): string;
    /**
     * Set logger minimum level (default: LogLevel.Info)
     * @param level Logger level, all logs below this level will be ignored
     */
    setLevel(level: LogLevel): void;
    /**
     * Get logger minimum level
     */
    getLevel(): LogLevel;
    /**
     * Enable pretty logs (disabled by default)
     * @param pretty Set to true to enable pretty logs (colorized and multilines)
     */
    setPretty(pretty: boolean): void;
    /**
     * Set logger output stream and enables it (default stream: process.stderr)
     * @param stream Stream (file, stdout...) where the logs will be rendered
     */
    setStream(stream: {write: Function}): void;
    /**
     * Write a log
     * @param level Level used for current log
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Silly level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Verbose level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Info level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    info(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Warn level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Alias to log() method with LogLevel.Error level
     * @param message Message to log
     * @param id Unique id of the current log, automatically generated if empty
     * @param tags List of tags for current log
     * @param details Any object useful for you
     */
    error(message: string, id?: string, tags?: string[], details?: any): void;
    /**
     * Returns a logger on which all log methods will use the same request id
     * Useful to include in an HTTP request object, to be able to log the whole request process
     * with one unique id and follow it easily in your logs
     * @param requestId Unique id
     */
    getRequestLogger(requestId: string): RequestLogger;
}

////////////////
// HTTP utils //
////////////////
export abstract class SafeShutdownServer {
    public readonly isShuttingDown: boolean;
    public safeShutdown(timeout?: number): Promise<void>;
    public static create<T extends Server>(server: T): T & SafeShutdownServer;
}

///////////////////
// MongoDb utils //
///////////////////
export interface MongoConnectionOptions {
    database: string;
    connectionString: string;
    shardedCluster?: boolean;
    readPreference?: 'primary'|'primaryPreferred'|'secondary'|'secondaryPreferred'|'nearest';
    replicaSetName?: string;
    username?: string;
    password?: string;
    debug?: boolean;
}

export class MongoConnection {
    protected database: string;
    protected options: any;

    constructor(options: MongoConnectionOptions);
    public connect(): Promise<void>;
    public disconnect(): Promise<void>;
    public getModel<T extends MongooseDocument>(name: string, schema: MongooseSchema, increment?: boolean): Promise<MongoosePaginateModel<T>>;
}

/////////////////
// Cache utils //
/////////////////
export interface Cache {
    get<T>(key: string|string[]): Promise<T>;
    getTtl(key: string|string[]): Promise<number>;
    set<T>(key: string|string[], value: T, ttl?: number): Promise<void>;
    del(key: string|string[]): Promise<void>;
    flush(): Promise<void>;
}

export interface RedisConnectionOptions {
    host: string;
    port?: number;
    db?: number;
    password?: string;
    separator?: string;
}

export class RedisConnection implements Cache {
    protected getKey(parts: string|string[]): string;

    constructor(connection: RedisConnectionOptions);
    public onError(callback: (err: Error) => any): void;
    public getSeparator(): string;
    public setSeparator(separator: string): void;
    public get<T>(key: string|string[]): Promise<T>;
    public getTtl(key: string|string[]): Promise<number>;
    public set<T>(key: string|string[], value: T, ttl?: number): Promise<void>;
    public del(key: string|string[]): Promise<void>;
    public flush(): Promise<void>;
}

//////////////////
// Pubsub utils //
//////////////////
export interface PubsubEmitterOptions {
    host: string;
    accessToken: string;
    userAgent: string;
    port?: number;
    secure?: boolean;
    timeout?: number;
    async?: boolean;
    debug?: boolean;
}

export class PubsubEmitter {
    protected host: string;
    protected accessToken: string;
    protected userAgent: string;
    protected port: number;
    protected secure: boolean;
    protected timeout: number;
    protected debug: boolean;

    constructor(options: PubsubEmitterOptions);
    public emit(topic: string, data: any): Promise<string>;
}

export interface PubsubMessage {
    provider: string;
    id: string;
    topic: string;
    date: Date;
    data: any;
    isSubscription: boolean;
    isUnsubscription: boolean;

    subscribeToTopic(): Promise<void>;
    unsubscribeFromTopic(): Promise<void>;
}

export class PubsubParser {
    public setMessageParseFunction(func: (message: string) => string): void;
    public parse(message: any): Promise<PubsubMessage>;
}

//////////////////////
// Exceptions utils //
//////////////////////
export class Exception extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;
    public readonly body: {code: string, message: string, details?: any};

    constructor(message: string, code?: string, details?: any);

    public static fromHttpCode(httpCode: number, message: string, code?: string, details?: any): Exception;
}

export class BadRequestException extends Exception {}
export class UnauthorizedException extends Exception {}
export class ForbiddenException extends Exception {}
export class NotFoundException extends Exception {}
export class MethodNotAllowedException extends Exception {}
export class ConflictException extends Exception {}
export class TooManyRequestsException extends Exception {}

////////////////////
// Promises utils //
////////////////////
export interface PromiseGenerator {
    (): Promise<any>;
}

export interface PromisePoolStats {
    /**
     * Number of rejected promises after current pool run
     */
    resolved: number;
    /**
     * Number of resolved promises after current pool run
     */
    rejected: number;
    /**
     * Current pool run duration in milliseconds
     */
    duration?: number;
}

export class PromisePool {
    /**
     * PromisePool constructor
     * @param generator Promise generator that should return a promise on each call, or null if all promises are executed
     * @param max Maximum number of parallel calls
     * @param min Minimum number of parallel calls, default to "max" parameter
     */
    constructor(generator: PromiseGenerator, max: number, min?: number);

    /**
     * Add a callback called every time a promise in the pool is resolved, passing in parameter the promise return
     * @param callback Callback function
     */
    public onResolved(callback: (data: any) => void): PromisePool;
    /**
     * Add a callback called every time a promise in the pool is rejected, passing in parameter the error
     * @param callback Callback function
     */
    public onRejected(callback: (err: Error) => void): PromisePool;
    /**
     * Start the pool of promises, returns statistics about execution when finished
     */
    public run(): Promise<PromisePoolStats>;
}

///////////////////
// Augmentations //
///////////////////

// HTTP module override
declare module 'http' {
    export interface IncomingMessage {
        xRequestId?: string;
        logger?: RequestLogger;
    }
}

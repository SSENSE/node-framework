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
    constructor(appId: string);
    enable(enabled: boolean): void;
    setPretty(pretty: boolean): void;
    setStream(stream: {write: Function}): void;
    setAppId(appId: string): void;
    setUserIdCallback(callback: UserIdCallback): void;
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

// AppLogger
export class AppLogger implements Logger {
    constructor(appId: string, level?: LogLevel, stream?: {write: Function});
    enable(enabled: boolean): void;
    setAppId(appId: string): void;
    getAppId(): string;
    generateRequestId(): string;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    setPretty(pretty: boolean): void;
    setStream(stream: {write: Function}): void;
    log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
    silly(message: string, id?: string, tags?: string[], details?: any): void;
    verbose(message: string, id?: string, tags?: string[], details?: any): void;
    info(message: string, id?: string, tags?: string[], details?: any): void;
    warn(message: string, id?: string, tags?: string[], details?: any): void;
    error(message: string, id?: string, tags?: string[], details?: any): void;
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
    readPreference?: string;
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
    del(key: string): Promise<void>;
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

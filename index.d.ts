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
    /**
     * Current server status, true is server is shutting down
     */
    public readonly isShuttingDown: boolean;
    /**
     * Init server safe shutdown sequence, returns when server is shut down
     * @param timeout Maximum duration to wait before force closing all connections (in milliseconds) defaults to infinite (never force closes)
     */
    public safeShutdown(timeout?: number): Promise<void>;
    /**
     * Augment a server to add safe shutdown capability (by adding safeShutdown() method), returns the augmented server
     * @param server Server to augment, must implement net.Server interface
     */
    public static create<T extends Server>(server: T): T & SafeShutdownServer;
}

export interface RequestValidation {
    /**
     * Request headers validation (be sure to use lowercase for each header to validate as node.js converts http headers to lowercase)
     */
    headers?: RequestValidationEntity;
    /**
     * Request params validation
     */
    params?: RequestValidationEntity;
    /**
     * Request query validation
     */
    query?: RequestValidationEntity;
    /**
     * Request body validation
     */
    body?: RequestValidationEntity;
}

export interface RequestValidationEntity {
    [key: string]: RequestValidationParam;
}

export interface RequestValidationParam {
    /**
     * Expected param type, must be a valid RequestValidationParamType
     */
    type: RequestValidationParamType;
    /**
     * Set to true if param is required (default false)
     */
    required?: boolean;
    /**
     * List of params required by this param, default undefined
     */
    requires?: string[];
    /**
     * List of params that cannot be used in conjunction with this param, default undefined
     */
    mutuallyExcludes?: string[];
    /**
     * Param min length (valid for types "string", "numeric", "number" and "array"), default undefined
     */
    min?: number;
    /**
     * Param max length (valid for types "string", "numeric", "number" and "array"), default undefined
     */
    max?: number;
    /**
     * Param required length (valid for types "string", "numeric", "number" and "array"), default undefined
     */
    length?: number;
    /**
     * Expected array type, only valid if type is "array", must be a valid RequestValidationParamArrayType
     */
    arrayType?: RequestValidationParamArrayType;
    /**
     * Array separator, useful to transform "stringified" array (for example in query) into a real javascript array
     * Only valid if type is "array" and arrayType is defined
     */
    arraySeparator?: string;
    /**
     * List of acceptable values for param
     */
    values?: any[];
    /**
     * RegExp that param must implemet to be considered valid (default undefined)
     */
    regex?: RegExp;
    /**
     * Optional callback function called after param validation to perform a specific transformation
     * @param data Parameter value after validation
     */
    format?: <T>(data: T) => T;
}

export type RequestValidationParamType = 'string'|'number'|'boolean'|'numeric'|'date'|'array'|'object';
export type RequestValidationParamArrayType = 'string'|'number'|'boolean'|'numeric';

export interface RequestValidatorConfig {
    /**
     * Allow fields that are not part of validation in request (headers, params, query and body), defaults to true
     * If set to false, all unknown fields will be removed
     */
    allowUnknownFields?: RequestValidatorConfigFields|boolean;
}

export interface RequestValidatorConfigFields {
    /**
     * Allow unknown fields for request headers (default true)
     */
    headers?: boolean;
    /**
     * Allow unknown fields for request params (default true)
     */
    params?: boolean;
    /**
     * Allow unknown fields for request query (default true)
     */
    query?: boolean;
    /**
     * Allow unknown fields for request body (default true)
     */
    body?: boolean;
}

export class RequestValidator {
    /**
     * Set validator global config
     * @param config Validator config
     */
    public static setConfig(config: RequestValidatorConfig): void;
    /**
     * Returns a middleware that handles validation for a given request
     * @param validation Valid RequestValidation object
     */
    public static validate(validation: RequestValidation): (req: any, res: any, next: Function) => void;
}

export class ValidationError extends Error {
    /**
     * List of request validation errors
     */
    public errors: FieldValidationError[];

    constructor(errors?: FieldValidationError[]);
}

export class FieldValidationError {
    /**
     * Field on which the validation failed
     */
    public readonly field: string;
    /**
     * Field location in request (headers, params, query, body)
     */
    public readonly location: string;
    /**
     * Validation error messages
     */
    public readonly messages: string[];

    constructor(field: string, location: string);
}

/**
 * HTTP client type, can be either:
 * * Json: will send HTTP requests with body as JSON object if provided
 * * UrlEncodedForm: will send HTTP requests with URL-Encoded Forms params if provided (application/x-www-form-urlencoded)
 */
export enum HttpClientType {
    Json,
    UrlEncodedForm
}

export interface HttpClientOptions {
    /**
     * Host on which perform all requests for this client, ex: www.google.com
     */
    host: string;
    /**
     * User agent to send as a header when performing each request
     */
    userAgent: string;
    /**
     * Port on which requests will be sent (default 80 if "secure" param is set to false, or 443 if true)
     */
    port?: number;
    /**
     * Use secure mode, if set to true, all requests will use https scheme, else http (default false)
     */
    secure?: boolean;
    /**
     * Number in milliseconds after which all requests will timeout (default 5000)
     */
    timeout?: number;
    /**
     * Number indicating how many times a request should be retried on failure (default 0)
     */
    retries?: number;
    /**
     * Valid HttpClientType, default Json
     */
    clientType?: HttpClientType;
    /**
     * Enable keep alive for this client, to improve requests performance, default true
     */
    keepAlive?: boolean;
    /**
     * Reset kept alive sockets after given number of milliseconds (useful to discover new hosts in a load balanced environment)
     * Only used if keepAlive is true, default 60000
     */
    keepAliveRefresh?: number;
}

export type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestStatus {
    /**
     * Request HTTP request method
     */
    method: HttpRequestMethod;
    /**
     * Request full url
     */
    url: string;
    /**
     * Request id (useful for debug purposes)
     */
    requestId: string;
    /**
     * Number of attempt (in case the requests fails and is retried)
     */
    attempt: number;
    /**
     * Request duration in milliseconds
     */
    duration: number;
    /**
     * Error message, only present if an error occurred during the request
     */
    errorMessage?: string;
}

export interface HttpRequestStatusCallback {
    /**
     * Callback interface that will be called after each request
     */
    (status: HttpRequestStatus): void;
}

export interface HttpHeaders {
    [name: string]: string | string[];
}

export interface HttpRequestOptions {
    /**
     * Body to send with the request
     */
    body?: any;
    /**
     * Extra HTTP headers to send with the request
     */
    headers?: HttpHeaders;
}

export interface HttpRequestResponse {
    /**
     * Response HTTP status code
     */
    statusCode: number;
    /**
     * Response HTTP headers
     */
    headers: HttpHeaders;
    /**
     * Response body, will be JSON parsed if valid JSON content, or raw string if not
     */
    body: any;
}

export class HttpClient {
    /**
     * Host on which perform all requests for this client, ex: www.google.com
     */
    protected host: string;
    /**
     * User agent to send as a header when performing each request
     */
    protected userAgent: string;
    /**
     * Number in milliseconds after which all requests will timeout (default 5000)
     */
    protected timeout: number;
    /**
     * Number indicating how many times a request should be retried on failure (default 0)
     */
    protected retries: number;
    /**
     * Valid HttpClientType, default Json
     */
    protected clientType: HttpClientType;

    /**
     * Create a new instance of HTTP client
     * @param options Valid HttpClientOptions object
     */
    constructor(options: HttpClientOptions);
    /**
     * Add a callback tht will be called after each request (even on failure), useful to implement a logger for example
     * @param callback A function implementing the HttpRequestStatusCallback interface
     */
    public afterRequest(callback: HttpRequestStatusCallback): void;
    /**
     * Send an HTTP request
     * @param requestId Unique identifier for this request (useful for debug purposes)
     * @param path Path on which perform the query
     * @param method Valid HttpRequestMethod, default "GET"
     * @param options Valid HttpRequestOptions
     */
    public sendRequest(requestId: string, path: string, method?: HttpRequestMethod, options?: HttpRequestOptions): Promise<HttpRequestResponse>;
}

export class SlackNotifier {
    /**
     * Create an helper that sends slack messages
     * @param webHookUrl Webhook url given by Slack when creating an incoming webhook (example: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX)
     * @param defaultDestination Default destination to send notifications to, can be either a channel (if starting with "#") or a user (if starting with "@")
     * @param userName Username that will be shown in slack channel when sending messages
     * @param icon Icon that will be shown in slack channel when sending messages (default :ghost:)
     */
    constructor(webHookUrl: string, defaultDestination: string, userName: string, icon?: string);
    /**
     * Send a message to Slack
     * @param message Message to send
     * @param detail Optional detail about message
     * @param destination Send message to a different destination, must be a valid destination (starting with "#" or "@"), uses defaultDestination if not specified
     */
    public send(message: string, detail?: string, destination?: string): Promise<void>;
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
    getBuffer(key: string|string[]): Promise<Buffer>;
    set<T>(key: string|string[], value: T, ttl?: number): Promise<void>;
    setBuffer(key: string|string[], value: Buffer, ttl?: number): Promise<void>;
    expire(key: string|string[], timeout: number): Promise<number>;
    incrby(key: string|string[], value: number): Promise<number>;
    del(key: string|string[]): Promise<void>;
    flush(): Promise<void>;
    keys(match: string|string[]): Promise<string[]>;
    pipeline(commands: string[][]): Promise<string[][]>;
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
    public getBuffer(key: string|string[]): Promise<Buffer>;
    public set<T>(key: string|string[], value: T, ttl?: number): Promise<void>;
    public setBuffer(key: string|string[], value: Buffer, ttl?: number): Promise<void>;
    public expire(key: string|string[], timeout: number): Promise<number>;
    public incrby(key: string|string[], value: number): Promise<number>;
    public del(key: string|string[]): Promise<void>;
    public flush(): Promise<void>;
    public keys(match: string|string[]): Promise<string[]>;
    public pipeline(commands: string[][]): Promise<string[][]>;
}

/////////////////
// MySQL utils //
/////////////////
export interface MysqlConnectionOptions {
    /**
     * MySQL server host
     */
    host: string;
    /**
     * MySQL database
     */
    database: string;
    /**
     * MySQL port (default: 3306)
     */
    port?: number;
    /**
     * MySQL username (default: null)
     */
    user?: string;
    /**
     * MySQL password (default: null)
     */
    password?: string;
    /**
     * Maximum number of parallel connections in internal MySQL connection pool (default: 10)
     */
    connectionLimit?: number;
}

export interface MysqlTransactionFunction {
    (transaction: {query: (sql: string, params?: any[]) => Promise<any>}): Promise<any>;
}

export interface MysqlLockTableOption {
    /**
     * Name of the table to lock
     */
    name: string;
    /**
     * Lock mode to use, must be one of 'READ' or 'WRITE'
     */
    mode: 'READ'|'WRITE';
}

export class MysqlConnection {
    constructor(options?: MysqlConnectionOptions);

    /**
     * Send a query to MySQL server and return a result
     * @param sql SQL query
     * @param params SQL query params for a query with parameters (will be protected against SQL injections)
     */
    public query(sql: string, params?: any[]): Promise<any>;
    /**
     * Execute a list of statements in a MySQL transactional way, managing the transaction (begin, commit, rollback) automatically
     * @param callback Function in which all the MySQL statements can be executed (will be run in a MySQL transaction)
     */
    public runInTransaction(callback: MysqlTransactionFunction): Promise<any>;

    /**
     * Same as runInTransaction() method, except it explicitly locks tables before running transaction (calling LOCK TABLES ... instead of START TRANSACTION)
     * Commit or rollback events are managed automatically
     * @param locks Array of MysqlLockTableOption (tables to lock with lock mode)
     * @param callback Function in which all the MySQL statements can be executed (will be run in a MySQL transaction)
     */
    public runWithLockTables(locks: MysqlLockTableOption[], callback: MysqlTransactionFunction): Promise<any>;
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
    constructor(isDevMode?: boolean);
    public setMessageParseFunction(func: (message: string) => any): void;
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
    public toJSON(): {code: string, message: string, details?: any};
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
    duration: number;
}

export class PromisePool {
    /**
     * PromisePool constructor
     * @param generator Promise generator that should return a promise on each call, or null if all promises are executed
     * @param max Maximum number of parallel promises to run
     */
    constructor(generator: PromiseGenerator, max: number);

    /**
     * Add a callback called every time a promise in the pool is resolved, passing in parameter the promise return
     * @param callback Callback function
     * @param index Index of the promise being resolved
     */
    public onResolved(callback: (data: any, index: number) => void): PromisePool;
    /**
     * Add a callback called every time a promise in the pool is rejected, passing in parameter the error
     * @param callback Callback function
     * @param index Index of the promise being rejected
     */
    public onRejected(callback: (err: Error, index: number) => void): PromisePool;
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

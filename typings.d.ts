// SSENSE namespace
declare namespace Ssense {
    import {Server, IncomingMessage, ServerResponse} from 'http';

    export namespace Logger {
        // AccessLogger
        export interface UserIdCallback {
            (req: IncomingMessage, res: ServerResponse): string;
        }

        export class AccessLogger {
            public constructor(appId: string);
            public enable(enabled: boolean): void;
            public setPretty(pretty: boolean): void;
            public setStream(stream: { write: Function }): void;
            public setAppId(appId: string): void;
            public setUserIdCallback(callback: UserIdCallback): void;
            public logRequest(req: IncomingMessage, res: ServerResponse, next?: Function): void;
        }

        // AppLogger
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
            setStream(stream: { write: Function }): void;
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

        export class AppLogger implements Logger {
            public constructor(appId: string, level?: LogLevel, stream?: { write: Function });
            public enable(enabled: boolean): void;
            public setAppId(appId: string): void;
            public getAppId(): string;
            public generateRequestId(): string;
            public setLevel(level: LogLevel): void;
            public getLevel(): LogLevel;
            public setPretty(pretty: boolean): void;
            public setStream(stream: { write: Function }): void;
            public log(level: LogLevel, message: string, id?: string, tags?: string[], details?: any): void;
            public silly(message: string, id?: string, tags?: string[], details?: any): void;
            public verbose(message: string, id?: string, tags?: string[], details?: any): void;
            public info(message: string, id?: string, tags?: string[], details?: any): void;
            public warn(message: string, id?: string, tags?: string[], details?: any): void;
            public error(message: string, id?: string, tags?: string[], details?: any): void;
            public getRequestLogger(requestId: string): RequestLogger;
        }
    }

    export namespace Http {
        // SafeShutdown
        export interface SafeShutdownServer {
            safeShutdown(timeout?: number): Promise<void>;
        }

        export class SafeShutdown {
            public static server<T extends Server>(server: T): T & SafeShutdownServer;
        }
    }
}

// Modules declaration
declare module "@ssense/framework" {
    export import logger = Ssense.Logger;
    export import http = Ssense.Http;
}

// Future implementation, not working yet
// declare module "@ssense/framework/logger" {
//     export import UserIdCallback = Ssense.Logger.UserIdCallback
//     export import AccessLogger = Ssense.Logger.AccessLogger;
//     export import LogLevel = Ssense.Logger.LogLevel;
//     export import Logger = Ssense.Logger.Logger;
//     export import RequestLogger = Ssense.Logger.RequestLogger;
//     export import AppLogger = Ssense.Logger.AppLogger;
// }

// HTTP module override
declare module 'http' {
    export interface IncomingMessage {
        xRequestId?: string;
        logger?: Ssense.Logger.RequestLogger;
    }
}

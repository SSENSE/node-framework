/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
export interface UserIdCallback {
    (req: IncomingMessage, res: ServerResponse): string;
}
export declare class AccessLogger {
    private appId;
    private enabled;
    private pretty;
    private stream;
    private userIdCallback;
    constructor(appId: string);
    enable(enabled: boolean): void;
    setPretty(pretty: boolean): void;
    setStream(stream: {
        write: Function;
    }): void;
    setAppId(appId: string): void;
    setUserIdCallback(callback: UserIdCallback): void;
    logRequest(req: IncomingMessage, res: ServerResponse, next?: Function): void;
    private log(req, res, duration?);
    private getUserId(req, res);
}

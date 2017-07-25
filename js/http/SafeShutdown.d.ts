/// <reference types="node" />
import { Server } from 'http';
export interface SafeShutdownServer {
    safeShutdown(timeout?: number): Promise<void>;
}
export declare class SafeShutdown {
    static server<T extends Server>(server: T): T & SafeShutdownServer;
}

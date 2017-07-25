import {RequestLogger} from './src/logger/AppLogger'

// HTTP module override
declare module 'http' {
    export interface IncomingMessage {
        xRequestId?: string;
        logger?: RequestLogger;
    }
}
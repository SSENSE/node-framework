declare module 'uuid' {
    export function v4(): string;
}

declare module 'http' {
    export interface IncomingMessage {
        header(name: string): string;
    }
}

declare module 'on-finished' {
    function onFinished(res: any, listener: Function): void;
    namespace onFinished {}
    export = onFinished;
}

declare module 'on-headers' {
    function onHeaders(res: any, listener: Function): void;
    namespace onHeaders {}
    export = onHeaders;
}

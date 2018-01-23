declare module 'uuid' {
    export function v4(): string;
}

declare module 'http' {
    export interface IncomingMessage {
        xRequestId?: string;
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

declare module 'agentkeepalive' {
    namespace agentkeepalive {
        interface KeepAliveAgentOptions {
            /**
             * Keep sockets around in a pool to be used by other requests in the future. Default = true.
             */
            keepAlive?: boolean;
            /**
             * When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Default = 1000. Only relevant if keepAlive is set to true.
             */
            keepAliveMsecs?: number;
            /**
             * Sets the free socket to timeout after freeSocketKeepAliveTimeout milliseconds of inactivity on the free socket. Default is 15000. Only relevant if keepAlive is set to true.
             */
            freeSocketKeepAliveTimeout?: number;
            /**
             * Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket. Default is freeSocketKeepAliveTimeout * 2.
             */
            timeout?: number;
            /**
             * Maximum number of sockets to allow per host. Default = Infinity.
             */
            maxSockets?: number;
            /**
             * Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true. Default = 256.
             */
            maxFreeSockets?: number;
            /**
             * Sets the socket active time to live, even if it's in use. If not setted the behaviour continues the same (the socket will be released only when free) Default = null.
             */
            socketActiveTTL?: number;
        }

        class HttpsAgent {
            constructor(options?: KeepAliveAgentOptions);
            public getCurrentStatus(): any;
        }
    }

    class agentkeepalive {
        constructor(options?: agentkeepalive.KeepAliveAgentOptions);
        public getCurrentStatus(): any;
    }

    export = agentkeepalive;
}

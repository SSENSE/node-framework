import * as request from 'request';
import * as KeepAliveAgent from 'agentkeepalive';
import { Base as Exception } from '../exceptions/Base';

export interface ClientOptions {
    host: string;
    userAgent: string;
    port?: number;
    secure?: boolean;
    timeout?: number;
    retries?: number;
    clientType?: ClientType;
    keepAlive?: boolean;
    keepAliveRefresh?: number;
}

export enum ClientType {
    Json,
    UrlEncodedForm
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Headers {
    [name: string]: string | string[];
}

export interface RequestOptions {
    body?: any;
    headers?: Headers;
}

export interface RequestStatus {
    method: RequestMethod;
    url: string;
    requestId: string;
    attempt: number;
    duration: number;
    errorMessage?: string;
}

export interface RequestStatusCallback {
    (status: RequestStatus): void;
}

export interface RequestResponse {
    statusCode: number;
    headers: Headers;
    body: any;
}

export class Client {
    private baseUri: string;
    private agent: KeepAliveAgent;
    private statusHandler: RequestStatusCallback;

    protected host: string;
    protected userAgent: string;
    protected timeout: number;
    protected retries: number;
    protected clientType: ClientType;

    constructor(options: ClientOptions) {
        if (!options || typeof options.host !== 'string' || options.host.trim().length === 0) {
            throw new Error('options.host is mandatory');
        } else if (typeof options.userAgent !== 'string' || options.userAgent.trim().length === 0) {
            throw new Error('options.userAgent is mandatory');
        } else if (options.port && (typeof options.port !== 'number' || options.port < 1 || options.port > 65535)) {
            throw new Error('options.port is invalid');
        } else if (options.timeout && (typeof options.timeout !== 'number' || options.timeout < 0)) {
            throw new Error('options.timeout is invalid');
        } else if (options.retries && (typeof options.retries !== 'number' || options.retries < 0)) {
            throw new Error('options.retries is invalid');
        } else if (options.clientType && !ClientType[options.clientType]) {
            throw new Error('options.clientType is invalid');
        }

        this.host = options.host.replace(/\/+$/g, '');
        this.userAgent = options.userAgent;
        const clientPort = options.port ? options.port : (options.secure === true ? 443 : 80);
        const clientSecure = options.secure === true || clientPort === 443;
        this.timeout = options.timeout || 5000;
        this.retries = options.retries || 0;
        const port = ((!clientSecure && clientPort === 80) || (clientSecure && clientPort === 443)) ? '' : `:${clientPort}`;
        this.baseUri = `${clientSecure ? 'https' : 'http'}://${this.host}${port}/`;
        this.clientType = options.clientType || ClientType.Json;

        const keepAlive = typeof options.keepAlive === 'boolean' ? options.keepAlive : true;
        if (keepAlive) {
            const agentOptions: KeepAliveAgent.KeepAliveAgentOptions = {
                keepAlive: true,
                socketActiveTTL: typeof options.keepAliveRefresh === 'number' && options.keepAliveRefresh > 0
                    ? options.keepAliveRefresh : 60000
            };
            this.agent = clientSecure ? new KeepAliveAgent.HttpsAgent(agentOptions) : new KeepAliveAgent(agentOptions);
        }
    }

    public afterRequest(callback: RequestStatusCallback): void {
        this.statusHandler = callback;
    }

    public async sendRequest(
        requestId: string, path: string, method: RequestMethod = 'GET', options?: RequestOptions
    ): Promise<RequestResponse> {
        const requestOptions: any = {
            method,
            url: `${this.baseUri}${path.replace(/^\/+/g, '')}`,
            headers: {
                'User-Agent': this.userAgent,
                'X-Request-Id': requestId
            },
            timeout: this.timeout
        };

        if (this.clientType === ClientType.Json) {
            requestOptions.json = true;
        }

        if (this.agent) {
            requestOptions.agent = this.agent;
        }

        if (options && typeof options === 'object') {
            if (options.headers && typeof options.headers === 'object') {
                requestOptions.headers = Object.assign(requestOptions.headers, options.headers);
            }

            if (options.body && typeof options.body === 'object') {
                if (this.clientType === ClientType.Json) { // JSON client
                    requestOptions.body = options.body;
                } else { // Url encoded form client
                    requestOptions.form = options.body;
                }
            }
        }

        // Send request and retry if failing
        for (let i = 0; ; i += 1) {
            const start = Date.now();
            let error: Error = null;

            try {
                return await this.executeRequest(method, requestOptions);
            } catch (e) {
                error = e;
                if (i >= this.retries) {
                    throw e;
                }
            } finally {
                // Call status handler if defined
                if (this.statusHandler) {
                    const status: RequestStatus = {
                        method,
                        url: requestOptions.url,
                        requestId,
                        attempt: i + 1,
                        duration: Date.now() - start,
                    };
                    if (error) {
                        status.errorMessage = error.message;
                    }
                    this.statusHandler(status);
                }
            }
        }
    }

    private executeRequest(method: RequestMethod, options: any): Promise<RequestResponse> {
        return new Promise<RequestResponse>((resolve, reject) => {
            request(options, (err: Error, res: request.RequestResponse, body: any) => {
                if (err) {
                    return reject(new Exception(err.message, null, {method, url: options.url}));
                }

                const code = res.statusCode;

                if (code >= 400) {
                    const errorMessage = 'An error occurred while sending HTTP request';
                    const detail: any = {
                        method,
                        url: options.url,
                        response: body
                    };

                    return reject(Exception.fromHttpCode(code, errorMessage, null, detail));
                }

                return resolve({
                    statusCode: code,
                    headers: res.headers,
                    body
                });
            });
        });
    }
}

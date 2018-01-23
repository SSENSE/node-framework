"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const KeepAliveAgent = require("agentkeepalive");
const Base_1 = require("../exceptions/Base");
var ClientType;
(function (ClientType) {
    ClientType[ClientType["Json"] = 0] = "Json";
    ClientType[ClientType["UrlEncodedForm"] = 1] = "UrlEncodedForm";
})(ClientType = exports.ClientType || (exports.ClientType = {}));
class Client {
    constructor(options) {
        if (!options || typeof options.host !== 'string' || options.host.trim().length === 0) {
            throw new Error('options.host is mandatory');
        }
        else if (typeof options.userAgent !== 'string' || options.userAgent.trim().length === 0) {
            throw new Error('options.userAgent is mandatory');
        }
        else if (options.port && (typeof options.port !== 'number' || options.port < 1 || options.port > 65535)) {
            throw new Error('options.port is invalid');
        }
        else if (options.timeout && (typeof options.timeout !== 'number' || options.timeout < 0)) {
            throw new Error('options.timeout is invalid');
        }
        else if (options.retries && (typeof options.retries !== 'number' || options.retries < 0)) {
            throw new Error('options.retries is invalid');
        }
        else if (options.clientType && !ClientType[options.clientType]) {
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
            const agentOptions = {
                keepAlive: true,
                socketActiveTTL: typeof options.keepAliveRefresh === 'number' && options.keepAliveRefresh > 0
                    ? options.keepAliveRefresh : 60000
            };
            this.agent = clientSecure ? new KeepAliveAgent.HttpsAgent(agentOptions) : new KeepAliveAgent(agentOptions);
        }
    }
    afterRequest(callback) {
        this.statusHandler = callback;
    }
    sendRequest(requestId, path, method = 'GET', options) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestOptions = {
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
                    if (this.clientType === ClientType.Json) {
                        requestOptions.body = options.body;
                    }
                    else {
                        requestOptions.form = options.body;
                    }
                }
            }
            for (let i = 0;; i += 1) {
                const start = Date.now();
                let error = null;
                try {
                    return yield this.executeRequest(method, requestOptions);
                }
                catch (e) {
                    error = e;
                    if (i >= this.retries) {
                        throw e;
                    }
                }
                finally {
                    if (this.statusHandler) {
                        const status = {
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
        });
    }
    executeRequest(method, options) {
        return new Promise((resolve, reject) => {
            request(options, (err, res, body) => {
                if (err) {
                    return reject(new Base_1.Base(err.message, null, { method, url: options.url }));
                }
                const code = res.statusCode;
                if (code >= 400) {
                    const errorMessage = 'An error occurred while sending HTTP request';
                    const detail = {
                        method,
                        url: options.url,
                        response: body
                    };
                    return reject(Base_1.Base.fromHttpCode(code, errorMessage, null, detail));
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
exports.Client = Client;
//# sourceMappingURL=Client.js.map
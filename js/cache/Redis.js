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
const IORedis = require("ioredis");
class Redis {
    constructor(connection) {
        this.separator = ':';
        if (typeof connection.separator === 'string' && connection.separator.trim() !== '') {
            this.separator = connection.separator.trim();
        }
        const options = {
            host: connection.host,
            port: !isNaN(connection.port) && +connection.port > 0 ? +connection.port : 6379,
            db: !isNaN(connection.db) && +connection.db >= 0 ? +connection.db : 0
        };
        if (typeof connection.password === 'string') {
            options.password = connection.password;
        }
        this.options = options;
    }
    get client() {
        if (!this._client) {
            this._client = new IORedis(this.options);
        }
        return this._client;
    }
    getKey(parts) {
        if (typeof parts === 'string') {
            return parts;
        }
        else {
            return parts.join(this.separator);
        }
    }
    onError(callback) {
        this.client.on('error', callback);
    }
    getSeparator() {
        return this.separator;
    }
    setSeparator(separator) {
        if (typeof separator === 'string' && separator.trim() !== '') {
            this.separator = separator;
        }
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.client.get(this.getKey(key));
            return result ? JSON.parse(result) : null;
        });
    }
    getTtl(key) {
        return this.client.ttl(this.getKey(key));
    }
    getBuffer(key) {
        return this.client.getBuffer(this.getKey(key));
    }
    set(key, value, ttl) {
        const realKey = this.getKey(key);
        if (!isNaN(ttl) && ttl > 0) {
            return this.client.setex(realKey, ttl, JSON.stringify(value));
        }
        else {
            return this.client.set(realKey, JSON.stringify(value));
        }
    }
    setBuffer(key, value, ttl) {
        const realKey = this.getKey(key);
        if (!isNaN(ttl) && ttl > 0) {
            return this.client.setex(realKey, ttl, value);
        }
        else {
            return this.client.set(realKey, value);
        }
    }
    del(key) {
        const cacheKey = this.getKey(key);
        if (cacheKey.indexOf('*') >= 0) {
            return new Promise((resolve, reject) => {
                const scanStream = this.client.scanStream({ match: cacheKey });
                let deleteKeys = [];
                scanStream.on('data', (keys) => {
                    if (keys.length > 0) {
                        deleteKeys = deleteKeys.concat(keys);
                    }
                });
                scanStream.on('error', (err) => {
                    return reject(err);
                });
                scanStream.on('end', () => __awaiter(this, void 0, void 0, function* () {
                    if (deleteKeys.length > 0) {
                        try {
                            yield this.client.pipeline(deleteKeys.map((k) => ['del', k])).exec();
                        }
                        catch (err) {
                            return reject(err);
                        }
                    }
                    return resolve();
                }));
            });
        }
        else {
            return this.client.del(cacheKey);
        }
    }
    flush() {
        return this.client.flushdb();
    }
    keys(match) {
        return this.client.keys(this.getKey(match));
    }
}
exports.Redis = Redis;
//# sourceMappingURL=Redis.js.map
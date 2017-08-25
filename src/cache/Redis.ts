import * as IORedis from 'ioredis';
import { Cache } from './Cache';

export interface ConnectionOptions {
    host: string;
    port?: number;
    db?: number;
    password?: string;
    separator?: string;
}

export class Redis implements Cache {
    private separator: string = ':';
    private client: IORedis.Redis;

    constructor(connection: ConnectionOptions) {
        if (typeof connection.separator === 'string' && connection.separator.trim() !== '') {
            this.separator = connection.separator.trim();
        }

        const options: IORedis.RedisOptions = {
            host: connection.host,
            port: !isNaN(connection.port) && +connection.port > 0 ? +connection.port : 6379,
            db: !isNaN(connection.db) && +connection.db >= 0 ? +connection.db : 0
        };

        if (typeof connection.password === 'string') {
            options.password = connection.password;
        }

        this.client = new IORedis(options);
    }

    protected getKey(parts: string|string[]): string {
        if (typeof parts === 'string') {
            return parts;
        } else {
            return parts.join(this.separator);
        }
    }

    public onError(callback: (err: Error) => any): void {
        this.client.on('error', callback);
    }

    public getSeparator(): string {
        return this.separator;
    }

    public setSeparator(separator: string): void {
        if (typeof separator === 'string' && separator.trim() !== '') {
            this.separator = separator;
        }
    }

    // tslint:disable-next-line:no-reserved-keywords
    public async get<T>(key: string|string[]): Promise<T> {
        const result = await this.client.get(this.getKey(key));
        return result ? JSON.parse(result) : null;
    }

    public getTtl(key: string|string[]): Promise<number> {
        return this.client.ttl(this.getKey(key));
    }

    // tslint:disable-next-line:no-reserved-keywords
    public set<T>(key: string|string[], value: T, ttl?: number): Promise<void> {
        const realKey = this.getKey(key);

        if (!isNaN(ttl) && ttl > 0) {
            return this.client.setex(realKey, ttl, JSON.stringify(value));
        } else {
            return this.client.set(realKey, JSON.stringify(value));
        }
    }

    public del(key: string|string[]): Promise<void> {
        return this.client.del(this.getKey(key));
    }

    public flush(): Promise<void> {
        return this.client.flushdb();
    }
}

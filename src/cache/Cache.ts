export interface Cache {
    get<T>(key: string|string[]): Promise<T>; // tslint:disable-line:no-reserved-keywords
    getTtl(key: string|string[]): Promise<number>;
    getBuffer(key: string|string[]): Promise<Buffer>;
    set<T>(key: string|string[], value: T, ttl?: number): Promise<void>; // tslint:disable-line:no-reserved-keywords
    expire(key: string|string[], timeout: number): Promise<number>;
    incrby(key: string|string[], value: number): Promise<number>;
    del(key: string|string[]): Promise<void>;
    flush(): Promise<void>;
    keys(match: string|string[]): Promise<string[]>;
    pipeline(commands: string[][]): Promise<string[][]>;
}

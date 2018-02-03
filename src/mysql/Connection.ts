import * as mysql from 'mysql';
import { PoolConnection } from 'mysql';

export interface ConnectionOptions {
    host: string;
    database: string;
    port?: number;
    user?: string;
    password?: string;
    connectionLimit?: number;
}

export class Connection {
    private pool: mysql.Pool;

    constructor(options?: ConnectionOptions) {
        if (!options || !options.host || typeof options.host !== 'string' || options.host.trim() === '') {
            throw new Error('options.host is required');
        } else if (!options.database || typeof options.database !== 'string' || options.database.trim() === '') {
            throw new Error('options.database is required');
        } else if (options.port && (typeof options.port !== 'number' || options.port < 1 || options.port > 65535)) {
            throw new Error('options.port is invalid');
        } else if (options.user && typeof options.user !== 'string') {
            throw new Error('options.user is invalid');
        } else if (options.password && typeof options.password !== 'string') {
            throw new Error('options.password is invalid');
        } else if (options.connectionLimit && (typeof options.connectionLimit !== 'number' || options.connectionLimit <= 0)) {
            throw new Error('options.connectionLimit is invalid');
        }

        this.pool = mysql.createPool(options);
    }

    private getPoolConnection(): Promise<PoolConnection> {
        return new Promise<PoolConnection>((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err);
                }

                resolve(connection);
            });
        });
    }

    private executeQuery(connection: PoolConnection, sql: string, params?: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            connection.query(sql, params, (err, result) => {
                connection.release();

                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    }

    public async query(sql: string, params?: any[]): Promise<any> {
        return this.executeQuery(await this.getPoolConnection(), sql, params);
    }
}

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

export interface TransactionFunction {
    (transaction: {query: (sql: string, params?: any[]) => Promise<any>}): Promise<any>;
}

export interface LockTableOption {
    name: string;
    mode: 'READ'|'WRITE';
}

class ConnectionWrapper {
    constructor(private connection: PoolConnection, private releaseConnection: boolean) {}

    public query(sql: string, params?: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.connection.query(sql, params, (err, result) => {
                if (this.releaseConnection) {
                    this.connection.release();
                }

                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    }
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

    public async query(sql: string, params?: any[]): Promise<any> {
        return new ConnectionWrapper(await this.getPoolConnection(), true).query(sql, params);
    }

    public async runInTransaction(callback: TransactionFunction): Promise<any> {
        // Get connection from pool
        const connection = await this.getPoolConnection();
        // Get connection wrapper
        const wrapper = new ConnectionWrapper(connection, false);

        let transactionStarted = false;

        try {

            // Start transaction
            await wrapper.query('START TRANSACTION;');
            transactionStarted = true;

            // Execute user callback
            const result = await Promise.resolve(callback(wrapper));

            // Commit transaction
            await wrapper.query('COMMIT;');

            return result;
        } catch (e) {
            if (transactionStarted) {
                await wrapper.query('ROLLBACK;');
            }
            throw e;
        } finally {
            connection.release();
        }
    }

    public async runWithLockTables(locks: LockTableOption[], callback: TransactionFunction): Promise<any> {
        if (!Array.isArray(locks) || locks.length === 0) {
            throw new Error('locks must be a MysqlLockTableOption[]');
        }

        // Get connection from pool
        const connection = await this.getPoolConnection();
        // Get connection wrapper
        const wrapper = new ConnectionWrapper(connection, false);

        let transactionStarted = false;
        let tablesLocked = false;

        try {

            // Start transaction
            await wrapper.query('SET autocommit=0;');
            transactionStarted = true;

            await wrapper.query(`LOCK TABLES ${locks.map(l => `${l.name} ${l.mode}`).join(', ')};`);
            tablesLocked = true;

            // Execute user callback
            const result = await Promise.resolve(callback(wrapper));

            // Commit transaction
            await wrapper.query('COMMIT;');

            return result;
        } catch (e) {
            if (transactionStarted) {
                await wrapper.query('ROLLBACK;');
            }
            throw e;
        } finally {
            if (tablesLocked) {
                await wrapper.query('UNLOCK TABLES;');
            }
            connection.release();
        }
    }
}

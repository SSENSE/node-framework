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
const mysql = require("mysql");
class ConnectionWrapper {
    constructor(connection, releaseConnection) {
        this.connection = connection;
        this.releaseConnection = releaseConnection;
    }
    query(sql, params) {
        return new Promise((resolve, reject) => {
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
class Connection {
    constructor(options) {
        if (!options || !options.host || typeof options.host !== 'string' || options.host.trim() === '') {
            throw new Error('options.host is required');
        }
        else if (!options.database || typeof options.database !== 'string' || options.database.trim() === '') {
            throw new Error('options.database is required');
        }
        else if (options.port && (typeof options.port !== 'number' || options.port < 1 || options.port > 65535)) {
            throw new Error('options.port is invalid');
        }
        else if (options.user && typeof options.user !== 'string') {
            throw new Error('options.user is invalid');
        }
        else if (options.password && typeof options.password !== 'string') {
            throw new Error('options.password is invalid');
        }
        else if (options.connectionLimit && (typeof options.connectionLimit !== 'number' || options.connectionLimit <= 0)) {
            throw new Error('options.connectionLimit is invalid');
        }
        this.pool = mysql.createPool(options);
    }
    getPoolConnection() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err);
                }
                resolve(connection);
            });
        });
    }
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ConnectionWrapper(yield this.getPoolConnection(), true).query(sql, params);
        });
    }
    runInTransaction(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield this.getPoolConnection();
            const wrapper = new ConnectionWrapper(connection, false);
            let transactionStarted = false;
            try {
                yield wrapper.query('START TRANSACTION;');
                transactionStarted = true;
                const result = yield Promise.resolve(callback(wrapper));
                yield wrapper.query('COMMIT;');
                return result;
            }
            catch (e) {
                if (transactionStarted) {
                    yield wrapper.query('ROLLBACK;');
                }
                throw e;
            }
            finally {
                connection.release();
            }
        });
    }
    runWithLockTables(locks, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(locks) || locks.length === 0) {
                throw new Error('locks must be a MysqlLockTableOption[]');
            }
            const connection = yield this.getPoolConnection();
            const wrapper = new ConnectionWrapper(connection, false);
            let transactionStarted = false;
            let tablesLocked = false;
            try {
                yield wrapper.query('SET autocommit=0;');
                transactionStarted = true;
                yield wrapper.query(`LOCK TABLES ${locks.map(l => `${l.name} ${l.mode}`).join(', ')};`);
                tablesLocked = true;
                const result = yield Promise.resolve(callback(wrapper));
                yield wrapper.query('COMMIT;');
                return result;
            }
            catch (e) {
                if (transactionStarted) {
                    yield wrapper.query('ROLLBACK;');
                }
                throw e;
            }
            finally {
                if (tablesLocked) {
                    yield wrapper.query('UNLOCK TABLES;');
                }
                connection.release();
            }
        });
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map
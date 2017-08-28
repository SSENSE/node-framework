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
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseIncrement = require("mongoose-auto-increment");
class Connection {
    constructor(options) {
        this.allowedReadPreferences = [
            'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'
        ];
        this.connected = false;
        this.connecting = false;
        mongoose.Promise = global.Promise;
        mongoose.set('debug', options.debug);
        this.database = options.database;
        const readPreference = options.readPreference || 'secondaryPreferred';
        if (this.allowedReadPreferences.indexOf(readPreference) < 0) {
            throw new Error(`Connection readPreference must be one of ${this.allowedReadPreferences.join(', ')}`);
        }
        this.options = {
            readPreference,
            useMongoClient: true
        };
        const credentials = options.username && options.password ? `${options.username}:${options.password}@` : '';
        if (options.shardedCluster === true) {
            this.options.ssl = false;
            this.options.sslValidate = false;
        }
        const replicaSet = options.replicaSetName && options.replicaSetName.length > 0 ? `?replicaSet=${options.replicaSetName}` : '';
        this.connectionString = `mongodb://${credentials}${options.connectionString}/${options.database}${replicaSet}`;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected && !this.connecting) {
                this.connecting = true;
                try {
                    yield mongoose.connect(this.connectionString, this.options);
                    this.connected = true;
                }
                catch (err) {
                    try {
                        mongoose.disconnect();
                    }
                    catch (e) { }
                    throw err;
                }
                finally {
                    this.connecting = false;
                }
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                yield mongoose.disconnect();
                this.connected = false;
            }
        });
    }
    getModel(name, schema, increment = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected && !this.connecting) {
                yield this.connect();
            }
            if (increment) {
                mongooseIncrement.initialize(mongoose.connection);
                schema.plugin(mongooseIncrement.plugin, { model: name, startAt: 1 });
            }
            schema.plugin(mongoosePaginate);
            return mongoose.model(name, schema);
        });
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map
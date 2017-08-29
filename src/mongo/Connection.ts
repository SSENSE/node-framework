import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as mongooseIncrement from 'mongoose-auto-increment';

export interface ConnectionOptions {
    database: string;
    connectionString: string;
    shardedCluster?: boolean;
    readPreference?: 'primary'|'primaryPreferred'|'secondary'|'secondaryPreferred'|'nearest';
    replicaSetName?: string;
    username?: string;
    password?: string;
    debug?: boolean;
}

export class Connection {
    private readonly allowedReadPreferences: string[] = [
        'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'
    ];
    private connectionString: string;
    private connected: boolean = false;
    private connecting: boolean = false;

    protected database: string;
    protected options: any;

    constructor(options: ConnectionOptions) {
        if (!options || !options.database || typeof options.database !== 'string' || options.database.trim() === '') {
            throw new Error('options.database is required');
        } else if (!options.connectionString || typeof options.connectionString !== 'string' || options.connectionString.trim() === '') {
            throw new Error('options.connectionString is required');
        }

        (<any> mongoose).Promise = global.Promise;
        this.database = options.database.trim();
        mongoose.set('debug', typeof options.debug === 'boolean' ? options.debug : false);

        const readPreference = options.readPreference || 'primary'; // Read from primary server by default
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

        const replicaSet = options.replicaSetName && typeof options.replicaSetName === 'string' && options.replicaSetName.trim() !== ''
            ? `?replicaSet=${options.replicaSetName.trim()}` : '';

        this.connectionString = `mongodb://${credentials}${options.connectionString}/${this.database}${replicaSet}`;
    }

    public async connect(): Promise<void> {
        if (!this.connected && !this.connecting) {
            this.connecting = true;
            try {
                await mongoose.connect(this.connectionString, this.options);
                this.connected = true;
            } catch (err) {
                try { mongoose.disconnect(); } catch (e) {} // tslint:disable-line:no-empty
                throw err;
            } finally {
                this.connecting = false;
            }
        }
    }

    public async disconnect(): Promise<void> {
        if (this.connected) {
            await mongoose.disconnect();
            this.connected = false;
        }
    }

    public async getModel<T extends mongoose.Document>(
        name: string, schema: mongoose.Schema, increment: boolean = true
    ): Promise<mongoose.PaginateModel<T>> {
        if (!this.connected && !this.connecting) {
            await this.connect();
        }

        // Initialize plugins
        if (increment) {
            mongooseIncrement.initialize(mongoose.connection);
            schema.plugin(mongooseIncrement.plugin, {model: name, startAt: 1});
        }
        schema.plugin(mongoosePaginate);

        return mongoose.model<T>(name, schema);
    }
}

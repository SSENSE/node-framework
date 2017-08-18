import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as mongooseIncrement from 'mongoose-auto-increment';

export interface ConnectionOptions {
    database: string;
    connectionString: string;
    shardedCluster: boolean;
    readPreference: string;
    replicaSetName: string;
    username: string;
    password: string;
    debug: boolean;
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
        (<any> mongoose).Promise = global.Promise;
        mongoose.set('debug', options.debug);
        this.database = options.database;

        const readPreference = options.readPreference || 'secondaryPreferred'; // Read from secondary server(s) by default
        if (this.allowedReadPreferences.indexOf(readPreference) < 0) {
            throw new Error(`Connection readPreference must be one of ${this.allowedReadPreferences.join(', ')}`);
        }

        this.options = {
            user: options.username,
            pass: options.password,
            db: { readPreference }
        };

        if (options.shardedCluster === true) {
            this.options.mongos = {
                ssl: false,
                sslValidate: false
            };
        }

        const replicaSet = options.replicaSetName && options.replicaSetName.length > 0 ? `?replicaSet=${options.replicaSetName}` : '';

        this.connectionString = `mongodb://${options.connectionString}/${options.database}${replicaSet}`;
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

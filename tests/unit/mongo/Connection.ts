import { expect } from 'chai';
import * as sinon from 'sinon';
import * as mongoose from 'mongoose';
import * as mongooseAutoIncrement from 'mongoose-auto-increment';
import { Connection as MongoConnection, ConnectionOptions } from '../../../src/mongo/Connection';

class MongoChild extends MongoConnection {
    public getOptions(): any {
        return this.options;
    }
}

let sandbox: sinon.SinonSandbox;

describe('MongoConnection', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should set debug mode according to options', () => {
            const mongooseSetStub = sandbox.stub(mongoose, 'set');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };
            // tslint:disable-next-line:no-unused-variable
            const connection = new MongoConnection(params);
            expect(mongooseSetStub.callCount).to.equal(1);
            expect(mongooseSetStub.lastCall.args).to.deep.equal(['debug', true], 'Debug sould be true');
        });

        it('should throw an error if readPreference param is invalid', () => {
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: 'baz',
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            expect(() => new MongoConnection(params)).to.throw(
                'Connection readPreference must be one of primary, primaryPreferred, secondary, secondaryPreferred, nearest'
            );
        });

        it('should set appropriate mongos option if shardedCluster param is true', () => {
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection1 = new MongoChild(params);
            expect(connection1.getOptions()).to.not.haveOwnProperty('mongos');

            params.shardedCluster = true;
            const connection2 = new MongoChild(params);
            expect(connection2.getOptions()).to.haveOwnProperty('mongos');
        });

        it('should add replicaset name in connection string if needed', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection1 = new MongoConnection(params);
            await connection1.connect();
            expect(mongooseConnectStub.callCount).to.equal(1);
            expect(mongooseConnectStub.lastCall.args[0]).to.not.contain('replicaSet');

            params.replicaSetName = 'bar';
            const connection2 = new MongoConnection(params);
            await connection2.connect();
            expect(mongooseConnectStub.callCount).to.equal(2);
            expect(mongooseConnectStub.lastCall.args[0]).to.contain('replicaSet=bar');
        });
    });

    describe('connect()', () => {
        it('should call mongoose connect method', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection = new MongoConnection(params);
            await connection.connect();
            expect(mongooseConnectStub.callCount).to.equal(1);
        });

        it('should not try to connect if already connected', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection = new MongoConnection(params);
            await connection.connect();
            expect(mongooseConnectStub.callCount).to.equal(1);

            await connection.connect();
            expect(mongooseConnectStub.callCount).to.equal(1);
        });

        it('should try to disconnect if an error occurs on connection', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect').throws(new Error('Foo'));
            const mongooseDisconnectStub = sandbox.stub(mongoose, 'disconnect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            let error: string = null;
            const connection = new MongoConnection(params);
            try {
                await connection.connect();
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
            expect(mongooseConnectStub.callCount).to.equal(1);
            expect(mongooseDisconnectStub.callCount).to.equal(1);
        });
    });

    describe('disconnect()', () => {
        it('should call mongoose disconnect method', async () => {
            sandbox.stub(mongoose, 'connect');
            const mongooseDisconnectStub = sandbox.stub(mongoose, 'disconnect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection = new MongoConnection(params);
            await connection.connect();
            await connection.disconnect();
            expect(mongooseDisconnectStub.callCount).to.equal(1);
        });

        it('should not try to disconnect if not connected', async () => {
            const mongooseDisconnectStub = sandbox.stub(mongoose, 'disconnect');
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };

            const connection = new MongoConnection(params);
            await connection.disconnect();
            expect(mongooseDisconnectStub.callCount).to.equal(0);
        });
    });

    describe('getModel()', () => {
        it('should try to connect if not connected', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect');
            const mongooseModelStub = sandbox.stub(mongoose, 'model');
            const schema: any = { plugin: sandbox.stub() };
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };
            const connection = new MongoConnection(params);
            await connection.getModel('foo', schema, false);
            expect(mongooseConnectStub.callCount).to.equal(1);
            expect(mongooseModelStub.callCount).to.equal(1);
            expect(schema.plugin.callCount).to.equal(1);

            await connection.getModel('foo', schema, false);
            expect(mongooseConnectStub.callCount).to.equal(1);
            expect(mongooseModelStub.callCount).to.equal(2);
            expect(schema.plugin.callCount).to.equal(2);
        });

        it('should load auto increment plugin by default', async () => {
            const mongooseConnectStub = sandbox.stub(mongoose, 'connect');
            const mongooseModelStub = sandbox.stub(mongoose, 'model');
            const autoIncrementInitializeStub = sandbox.stub(mongooseAutoIncrement, 'initialize');
            const schema: any = { plugin: sandbox.stub() };
            const params: ConnectionOptions = {
                database: 'foo',
                connectionString: 'bar',
                shardedCluster: false,
                readPreference: null,
                replicaSetName: null,
                username: null,
                password: null,
                debug: true
            };
            const connection = new MongoConnection(params);
            await connection.getModel('foo', schema);
            expect(mongooseConnectStub.callCount).to.equal(1);
            expect(mongooseModelStub.callCount).to.equal(1);
            expect(autoIncrementInitializeStub.callCount).to.equal(1);
            expect(schema.plugin.callCount).to.equal(2);
        });
    });
});

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as mysql from 'mysql';
import { Connection as MysqlConnection } from '../../../src/mysql/Connection';

let sandbox: sinon.SinonSandbox;
const pool: any = {getConnection: Function};
const poolConnection: any = {query: Function, release: Function};

describe('MysqlConnection', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should throw an error if options.host is invalid', () => {
            expect(() => new MysqlConnection({host: '', database: ''})).to.throw('options.host is required');
        });

        it('should throw an error if options.database is invalid', () => {
            expect(() => new MysqlConnection({host: 'a', database: ''})).to.throw('options.database is required');
        });

        it('should throw an error if options.port is invalid', () => {
            expect(() => new MysqlConnection({host: 'a', database: 'b', port: 99999})).to.throw('options.port is invalid');
        });

        it('should throw an error if options.user is invalid', () => {
            expect(() => new MysqlConnection(<any> {host: 'a', database: 'b', user: 1})).to.throw('options.user is invalid');
        });

        it('should throw an error if options.password is invalid', () => {
            expect(() => new MysqlConnection(<any> {host: 'a', database: 'b', password: 1})).to.throw('options.password is invalid');
        });

        it('should throw an error if options.connectionLimit is invalid', () => {
            expect(() => new MysqlConnection(<any> {host: 'a', database: 'b', connectionLimit: -1}))
                .to.throw('options.connectionLimit is invalid');
        });

        it('should create a MySQL connection pool', () => {
            const stub = sandbox.stub(mysql, <any> 'createPool');
            const connection = new MysqlConnection({host: 'localhost', database: 'db'});
            expect(connection).to.haveOwnProperty('pool');
            expect(stub.callCount).to.equal(1);
            expect(stub.lastCall.args).to.deep.equal([{host: 'localhost', database: 'db'}]);
        });
    });

    describe('query()', () => {
        it('should try to get a valid MySQL connection and throw on error', async () => {
            sandbox.stub(mysql, <any> 'createPool').returns(pool);
            sandbox.stub(pool, <any> 'getConnection').callsFake((cb: (err: Error) => void) => {
                cb(new Error('Foo'));
            });
            const connection = new MysqlConnection({host: 'a', database: 'b'});
            let error: string;
            try {
                await connection.query('');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
        });

        it('should try to execute a query and throw on error', async () => {
            sandbox.stub(mysql, <any> 'createPool').returns(pool);
            const releaseStub = sandbox.stub(poolConnection, <any> 'release');
            const queryStub = sandbox.stub(poolConnection, <any> 'query').callsFake(
                (sql: string, params: any[], cb: (err: Error) => void) => {
                    cb(new Error('Bar'));
                }
            );
            sandbox.stub(pool, <any> 'getConnection').callsFake((cb: (err: Error, connection: any) => void) => {
                cb(null, poolConnection);
            });
            const connection = new MysqlConnection({host: 'a', database: 'b'});
            let error: string;
            try {
                await connection.query('query');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Bar');
            expect(releaseStub.callCount).to.equal(1);
            expect(queryStub.callCount).to.equal(1);
            expect(queryStub.lastCall.args[0]).to.equal('query');
        });

        it('should execute a query and return a result on success', async () => {
            sandbox.stub(mysql, <any> 'createPool').returns(pool);
            const releaseStub = sandbox.stub(poolConnection, <any> 'release');
            const queryStub = sandbox.stub(poolConnection, <any> 'query').callsFake(
                (sql: string, params: any[], cb: (err: Error, result: any) => void) => {
                    cb(null, 'result');
                }
            );
            sandbox.stub(pool, <any> 'getConnection').callsFake((cb: (err: Error, connection: any) => void) => {
                cb(null, poolConnection);
            });
            const connection = new MysqlConnection({host: 'a', database: 'b'});
            const result = await connection.query('query');
            expect(result).to.equal('result');
            expect(releaseStub.callCount).to.equal(1);
            expect(queryStub.callCount).to.equal(1);
            expect(queryStub.lastCall.args[0]).to.equal('query');
        });
    });
});

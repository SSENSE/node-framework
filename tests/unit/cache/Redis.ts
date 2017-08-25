import { expect } from 'chai';
import * as sinon from 'sinon';
import * as ioredis from 'ioredis';
import { Redis } from '../../../src/cache/Redis';

let sandbox: sinon.SinonSandbox;

describe('Redis', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should check params and set default values if needed', () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            let cache = new Redis({host: 'foo'});
            expect(cache.getSeparator()).to.equal(':');

            cache = new Redis({host: 'foo', separator: '    ', password: 'baz'});
            expect(cache.getSeparator()).to.equal(':');

            cache = new Redis({host: 'foo', separator: 'bar'});
            expect(cache.getSeparator()).to.equal('bar');
        });
    });

    describe('getSeparator()', () => {
        it('should return separator', () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const cache = new Redis({host: 'foo'});
            expect(cache.getSeparator()).to.equal(':');
        });
    });

    describe('setSeparator()', () => {
        it('should update separator', () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const cache = new Redis({host: 'foo'});
            expect(cache.getSeparator()).to.equal(':');
            cache.setSeparator('bar');
            expect(cache.getSeparator()).to.equal('bar');
        });

        it('should not update separator if value is invalid', () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const cache = new Redis({host: 'foo'});
            expect(cache.getSeparator()).to.equal(':');
            cache.setSeparator('     ');
            expect(cache.getSeparator()).to.equal(':');
            cache.setSeparator(null);
            expect(cache.getSeparator()).to.equal(':');
        });
    });

    describe('get()', () => {
        it('should return null if key doesn\'t exist', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const getStub = sandbox.stub(ioredis.prototype, 'get').returns(null);
            const cache = new Redis({host: 'foo'});
            const result = await cache.get(['foo', 'bar']);
            expect(getStub.callCount).to.equal(1);
            expect(getStub.lastCall.args).to.deep.equal(['foo:bar']);
            expect(result).to.equal(null, 'Result should be null');
        });

        it('should JSON parse result and return it if key exists', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const getStub = sandbox.stub(ioredis.prototype, 'get').returns(JSON.stringify({foo: 'bar'}));
            const jsonParseSpy = sandbox.spy(JSON, 'parse');
            const cache = new Redis({host: 'foo'});
            const result = await cache.get(['foo']);
            expect(getStub.callCount).to.equal(1);
            expect(getStub.lastCall.args).to.deep.equal(['foo']);
            expect(jsonParseSpy.callCount).to.equal(1);
            expect(result).to.deep.equal({foo: 'bar'});
        });
    });

    describe('getTtl()', () => {
        it('should return a negative value if key doesn\'t exist', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const getTtlStub = sandbox.stub(ioredis.prototype, 'ttl').returns(-1);
            const cache = new Redis({host: 'foo'});
            const result = await cache.getTtl('foo');
            expect(getTtlStub.callCount).to.equal(1);
            expect(getTtlStub.lastCall.args).to.deep.equal(['foo']);
            expect(result).to.equal(-1);
        });

        it('should return key TTL in seconds if key exists', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const getTtlStub = sandbox.stub(ioredis.prototype, 'ttl').returns(3);
            const cache = new Redis({host: 'foo'});
            const result = await cache.getTtl('foo');
            expect(getTtlStub.callCount).to.equal(1);
            expect(getTtlStub.lastCall.args).to.deep.equal(['foo']);
            expect(result).to.equal(3);
        });
    });

    describe('set()', () => {
        it('should call set method on base client if TTL is not defined', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const setStub = sandbox.stub(ioredis.prototype, 'set');
            const cache = new Redis({host: 'foo'});
            const data: any = {foo: 'bar'};
            await cache.set('foo', {foo: 'bar'});
            expect(setStub.callCount).to.equal(1);
            expect(setStub.lastCall.args).to.deep.equal(['foo', JSON.stringify(data)]);
        });

        it('should call setex method on base client if TTL is defined', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const setexStub = sandbox.stub(ioredis.prototype, 'setex');
            const cache = new Redis({host: 'foo'});
            const data: any = {foo: 'bar'};
            await cache.set('foo', {foo: 'bar'}, 15);
            expect(setexStub.callCount).to.equal(1);
            expect(setexStub.lastCall.args).to.deep.equal(['foo', 15, JSON.stringify(data)]);
        });
    });

    describe('del()', () => {
        it('should call del method on base client', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const delStub = sandbox.stub(ioredis.prototype, 'del');
            const cache = new Redis({host: 'foo'});
            await cache.del(['foo', 'bar']);
            expect(delStub.callCount).to.equal(1);
            expect(delStub.lastCall.args).to.deep.equal(['foo:bar']);
        });
    });

    describe('flush()', () => {
        it('should call flushdb method on base client', async () => {
            sandbox.stub(ioredis.prototype, 'connect').returns(Promise.resolve());
            const flushdbStub = sandbox.stub(ioredis.prototype, 'flushdb');
            const cache = new Redis({host: 'foo'});
            await cache.flush();
            expect(flushdbStub.callCount).to.equal(1);
        });
    });
});

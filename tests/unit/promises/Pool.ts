import { expect } from 'chai';
import * as sinon from 'sinon';
import { Pool } from '../../../src/promises/Pool';

let sandbox: sinon.SinonSandbox;

describe('PromisePool', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should throw errors if constructor parameters are invalid', () => {
            expect(() => new Pool(null, 0)).to.throw('generator must be a function');
            expect(() => new Pool(sandbox.spy(), 0)).to.throw('max must be a number greater than 0');
        });
    });

    describe('onResolved()', () => {
        it('should add a listener for "resolved" event on internal emitter', () => {
            const pool = new Pool(sandbox.spy(), 50);
            const onSpy = sandbox.spy((<any> pool).emitter, 'on');
            const spy = sandbox.spy();
            pool.onResolved(spy);
            expect(onSpy.callCount).to.equal(1);
            expect(onSpy.lastCall.args).to.deep.equal(['resolved', spy]);
        });
    });

    describe('onRejected()', () => {
        it('should add a listener for "rejected" event on internal emitter', () => {
            const pool = new Pool(sandbox.spy(), 50);
            const onSpy = sandbox.spy((<any> pool).emitter, 'on');
            const spy = sandbox.spy();
            pool.onRejected(spy);
            expect(onSpy.callCount).to.equal(1);
            expect(onSpy.lastCall.args).to.deep.equal(['rejected', spy]);
        });
    });

    describe('run()', () => {
        it('should throw an error if pool is already running', async () => {
            const pool = new Pool(sandbox.spy(), 50);
            (<any> pool).started = true;
            let error: string = null;
            try {
                await pool.run();
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Pool is already running');
        });

        it('should handle errors and reset pool parameters', async () => {
            const pool = new Pool(sandbox.stub().returns('foo'), 10);
            sandbox.stub((<any> pool).emitter, 'once').throws(new Error('Foo'));
            let error: string = null;
            try {
                await pool.run();
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
            expect((<any> pool).started).to.equal(false, 'Pool should be stopped');
            expect((<any> pool).finished).to.equal(true, 'Pool should be stopped');
        });

        it('should call listeners when a promise is resolved or rejected', async () => {
            let i = 0;
            const generator = (): any => {
                i += 1;
                if (i > 10) {
                    return null;
                }

                return new Promise<number>((resolve, reject) => {
                    const current = i;
                    setTimeout(() => {
                        return current % 2 === 0 ? resolve(current) : reject(new Error(current.toString()));
                    }, 10);
                });
            };

            const resolvedSpy = sandbox.spy();
            const rejectedSpy = sandbox.spy();
            const pool = new Pool(generator, 50).onResolved(data => resolvedSpy(data)).onRejected(err => rejectedSpy(err));
            await pool.run();
            expect(resolvedSpy.callCount).to.equal(5);
            expect(rejectedSpy.callCount).to.equal(5);
        });

        it('should run all promises and return stats when finished', async () => {
            let i = 0;
            const generator = (): any => {
                i += 1;
                if (i > 10) {
                    return null;
                }

                return new Promise<number>((resolve, reject) => {
                    const current = i;
                    setTimeout(() => {
                        return current % 2 === 0 ? resolve(current) : reject(new Error(current.toString()));
                    }, 10);
                });
            };

            const pool = new Pool(generator, 2);
            expect(await pool.run()).to.deep.include({resolved: 5, rejected: 5});
        });
    });
});

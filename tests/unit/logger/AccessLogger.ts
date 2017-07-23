import { expect } from 'chai';
import * as sinon from 'sinon';
import * as mockRequire from 'mock-require';
import { AccessLogger } from '../../../src/logger/AccessLogger';
import { Color } from '../../../src/logger/Common';

let sandbox: sinon.SinonSandbox;

describe('AccessLogger', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
        mockRequire.stopAll();
    });

    describe('enable()', () => {
        it('should be enabled by default and log requests', () => {
            const logger = new AccessLogger('foo');
            const logStub = sandbox.stub(<any> logger, 'log');
            logger.logRequest(null, null);
            expect(logStub.callCount).to.equal(1);
        });

        it('should not log requests when disabled', () => {
            const logger = new AccessLogger('foo');
            const logStub = sandbox.stub(<any> logger, 'log');
            logger.enable(false);
            logger.logRequest(null, null);
            expect(logStub.callCount).to.equal(0);

            const next = sandbox.spy();
            const dateNowSpy = sandbox.spy(Date, 'now');
            logger.logRequest(null, null, next);
            expect(next.callCount).to.equal(1);
            expect(dateNowSpy.callCount).to.equal(0);
        });
    });

    describe('setPretty()', () => {
        it('should not write pretty logs by default', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setStream({write: writeStub});
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.not.contain('\x1B');
        });

        it('should write pretty logs', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name !== 'content-length' ? name : null);
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setStream({write: writeStub});
            logger.setPretty(true);
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('\x1B');
        });
    });

    describe('setStream()', () => {
        it('should enable logger when setting new stream', () => {
            const logger = new AccessLogger('foo');
            const logStub = sandbox.stub(<any> logger, 'log');
            logger.enable(false);
            logger.setStream({write: sandbox.stub()});
            logger.logRequest(null, null);
            expect(logStub.callCount).to.equal(1);
        });
    });

    describe('setAppId()', () => {
        it('should update appId', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setAppId('bar');
            logger.setStream({write: writeStub});
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"app":"bar"');
        });
    });

    describe('setUserIdCallback()', () => {
        it('should log user id', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const userIdCallbackStub = sandbox.stub().returns('userId');
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setUserIdCallback(userIdCallbackStub);
            logger.setStream({write: writeStub});
            logger.logRequest(req, res);
            expect(userIdCallbackStub.callCount).to.equal(1);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"userId":"userId"');
        });
    });

    describe('logRequest()', () => {
        it('should log remote address if X-Forwarded-For header is absent', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name !== 'x-forwarded-for' ? name : null);
            const req: any = {header: headerStub, connection: {remoteAddress: 'remoteAddress'}};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setAppId('bar');
            logger.setStream({write: writeStub});
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"ip":"remoteAddress"');
        });

        it('should log appropriate color according to response code in pretty mode', () => {
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub, statusCode: 503};
            const logger = new AccessLogger('foo');
            logger.setStream({write: writeStub});
            logger.setPretty(true);

            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1B[${Color.red}m`);

            res.statusCode = 404;
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(2);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1B[${Color.yellow}m`);

            res.statusCode = 301;
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(3);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1B[${Color.cyan}m`);

            res.statusCode = 204;
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(4);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1B[${Color.green}m`);
        });

        it('should log latency in normal mode', () => {
            const now = Date.now();
            sandbox.useFakeTimers(now);
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub, _time: now - 3};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setStream({write: writeStub});
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"resTime":3');
        });

        it('should log latency in pretty mode', () => {
            const now = Date.now();
            sandbox.useFakeTimers(now);
            const writeStub = sandbox.stub();
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub, _time: now - 3};
            const res: any = {getHeader: headerStub};
            const logger = new AccessLogger('foo');
            logger.setStream({write: writeStub});
            logger.setPretty(true);
            logger.logRequest(req, res);
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('3 ms');
        });

        it('should compute latency if request doesn\'t expose it', (done: Function) => {
            let now = 0;
            sandbox.stub(Date, 'now').callsFake(() => {
                now += 10;
                return now;
            });
            const writeStub = sandbox.stub().callsFake((line: string) => {
                try {
                    expect(line).to.contain('"resTime":10');
                    done();
                } catch (e) {
                    done(e);
                }
            });
            const headerStub = sandbox.stub().callsFake((name: string) => name);
            const req: any = {header: headerStub};
            const res: any = {getHeader: headerStub};
            const onHeadersStub = sandbox.stub().callsFake((r: any, callback: Function) => {
                callback();
            });
            mockRequire('on-headers', onHeadersStub);
            const accessLogger: any = (<any> mockRequire.reRequire('../../../src/logger/AccessLogger')).AccessLogger;
            const logger: AccessLogger = new accessLogger('foo');
            logger.setStream({write: writeStub});
            logger.logRequest(req, res, sandbox.spy());
        });
    });
});

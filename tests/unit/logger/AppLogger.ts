import { expect } from 'chai';
import * as sinon from 'sinon';
import { AppLogger, LogLevel } from '../../../src/logger/AppLogger';
import * as common from '../../../src/logger/Common';

let sandbox: sinon.SinonSandbox;

describe('AppLogger', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('enable()', () => {
        it('should be enabled by default and write logs', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
        });

        it('should not write logs when disabled', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.enable(false);
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(0);
        });
    });

    describe('setAppId()', () => {
        it('should update appId', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', undefined, {write: writeStub});
            logger.setAppId('bar');
            logger.log(LogLevel.Info, 'baz');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"app":"bar"');
        });
    });

    describe('getAppId()', () => {
        it('should return appId', () => {
            const logger = new AppLogger('foo');
            expect(logger.getAppId()).to.equal('foo');

            logger.setAppId('bar');
            expect(logger.getAppId()).to.equal('bar');
        });
    });

    describe('generateRequestId()', () => {
        it('should generate request id', () => {
            const generateRequestIdStub = sandbox.stub(common, 'generateRequestId').returns('bar');
            const logger = new AppLogger('foo');
            expect(logger.generateRequestId()).to.equal('bar');
            expect(generateRequestIdStub.callCount).to.equal(1);
        });
    });

    describe('setLevel()', () => {
        it('should update log level', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);

            logger.setLevel(LogLevel.Warn);
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
        });
    });

    describe('getLevel()', () => {
        it('should return log level', () => {
            const logger = new AppLogger('foo', LogLevel.Warn);
            expect(logger.getLevel()).to.equal(LogLevel.Warn);

            logger.setLevel(LogLevel.Silly);
            expect(logger.getLevel()).to.equal(LogLevel.Silly);
        });

        it('should return log level info by default', () => {
            const logger = new AppLogger('foo');
            expect(logger.getLevel()).to.equal(LogLevel.Info);
        });
    });

    describe('setPretty()', () => {
        it('should not write pretty logs by default', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.not.contain('\x1B');
        });

        it('should write pretty logs', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.setPretty(true);
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('\x1B');
        });
    });

    describe('setStream()', () => {
        it('should write to new stream', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);

            const writeStub2 = sandbox.stub();
            logger.setStream({write: writeStub2});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub2.callCount).to.equal(1);
        });

        it('should enable logger when setting new stream', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.enable(false);
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(0);

            logger.setStream({write: writeStub});
            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(1);
        });
    });

    describe('log()', () => {
        it('should not write logs when level < logger level', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(LogLevel.Verbose, 'bar');
            expect(writeStub.callCount).to.equal(0);
        });

        it('should default to "log" level when called with an invalid level', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.log(50, 'bar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('"level":"log"');
        });

        it('should log appropriate color according to log level in pretty mode', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Silly, {write: writeStub});
            logger.setPretty(true);

            logger.log(LogLevel.Silly, 'bar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1b[${common.Color.cyan}m`);

            logger.log(LogLevel.Verbose, 'bar');
            expect(writeStub.callCount).to.equal(2);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1b[${common.Color.blue}m`);

            logger.log(LogLevel.Info, 'bar');
            expect(writeStub.callCount).to.equal(3);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1b[${common.Color.green}m`);

            logger.log(LogLevel.Warn, 'bar');
            expect(writeStub.callCount).to.equal(4);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1b[${common.Color.yellow}m`);

            logger.log(LogLevel.Error, 'bar');
            expect(writeStub.callCount).to.equal(5);
            expect(writeStub.lastCall.args[0]).to.contain(`\x1b[${common.Color.red}m`);

            logger.log(50, 'bar');
            expect(writeStub.callCount).to.equal(6);
            expect(writeStub.lastCall.args[0]).to.contain('\x1b[0m');
        });

        it('should format log details in pretty mode', () => {
            const writeStub = sandbox.stub();
            const logger = new AppLogger('foo', LogLevel.Info, {write: writeStub});
            logger.setPretty(true);
            logger.log(LogLevel.Info, 'message', 'id', [], 'foobar');
            expect(writeStub.callCount).to.equal(1);
            expect(writeStub.lastCall.args[0]).to.contain('{\n        "string": "foobar"\n    }');
        });
    });

    describe('silly()', () => {
        it('should write silly logs', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');
            logger.silly('foo');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[0]).to.equal(LogLevel.Silly);
        });
    });

    describe('verbose()', () => {
        it('should write verbose logs', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');
            logger.verbose('foo');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[0]).to.equal(LogLevel.Verbose);
        });
    });

    describe('info()', () => {
        it('should write info logs', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');
            logger.info('foo');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[0]).to.equal(LogLevel.Info);
        });
    });

    describe('warn()', () => {
        it('should write warn logs', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');
            logger.warn('foo');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[0]).to.equal(LogLevel.Warn);
        });
    });

    describe('error()', () => {
        it('should write error logs', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');
            logger.error('foo');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[0]).to.equal(LogLevel.Error);
        });
    });

    describe('getRequestLogger()', () => {
        it('should return request logger', () => {
            const logger = new AppLogger('foo');
            const requestLogger = logger.getRequestLogger('foo');
            const objectKeys = Object.keys(requestLogger);
            expect(objectKeys.length).to.equal(5);
        });

        it('should call original logger log method', () => {
            const logger = new AppLogger('foo');
            const logStub = sandbox.stub(logger, 'log');

            const requestLogger = logger.getRequestLogger('foo');
            const method = (<any> requestLogger)[Object.keys(requestLogger)[0]];
            expect(typeof method).to.equal('function');
            method('baz');
            expect(logStub.callCount).to.equal(1);
            expect(logStub.lastCall.args[1]).to.equal('baz');
        });
    });
});

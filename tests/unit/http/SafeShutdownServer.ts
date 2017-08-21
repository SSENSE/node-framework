import { expect } from 'chai';
import * as sinon from 'sinon';
import { SafeShutdownServer } from '../../../src/http/SafeShutdownServer';

let sandbox: sinon.SinonSandbox;

describe('SafeShutdownServer', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('create()', () => {
        it('should add an extra "safeShutdown" method on existing server', () => {
            const server = SafeShutdownServer.create(<any> {on: sandbox.spy()});
            expect(server).to.haveOwnProperty('safeShutdown');
            expect(typeof server.safeShutdown).to.equal('function');
        });

        it('should add an extra "isShuttingDown" property on existing server', () => {
            const server = SafeShutdownServer.create(<any> {on: sandbox.spy()});
            expect(server).to.haveOwnProperty('isShuttingDown');
            expect(server.isShuttingDown).to.equal(false, 'Server should not be shutting down by default');
        });

        it('should listen for client connections and store reference to them', () => {
            const onEventStub = sandbox.stub();
            SafeShutdownServer.create(<any> { on: onEventStub });
            expect(onEventStub.callCount).to.equal(2);
            expect(typeof onEventStub.firstCall.args[1]).to.equal('function');
            const connectEvent: (socket: any) => any = onEventStub.firstCall.args[1];

            const onSocketCloseStub = sandbox.stub();
            const socket: any = {on: onSocketCloseStub};
            connectEvent(socket);
            expect(socket).to.deep.include({
                _isIdle: true,
                _socketId: 1
            });
            expect(onSocketCloseStub.callCount).to.equal(1);
            expect(onSocketCloseStub.lastCall.args[0]).to.equal('close');
            expect(typeof onSocketCloseStub.lastCall.args[1]).to.equal('function');
            onSocketCloseStub.lastCall.args[1]();
        });

        it('should listen for client requests and update its state accordingly', () => {
            const onEventStub = sandbox.stub();
            SafeShutdownServer.create(<any> { on: onEventStub });
            expect(onEventStub.callCount).to.equal(2);
            expect(typeof onEventStub.lastCall.args[1]).to.equal('function');
            const requestEvent: (req: any, res: any) => any = onEventStub.lastCall.args[1];

            const onResponseFinishStub = sandbox.stub();
            const req: any = {socket: {}};
            const res: any = {on: onResponseFinishStub};
            requestEvent(req, res);
            expect(req.socket).to.deep.equal({
                _isIdle: false
            }, 'Socket should not be idle');
            expect(onResponseFinishStub.callCount).to.equal(1);
            expect(onResponseFinishStub.lastCall.args[0]).to.equal('finish');
            expect(typeof onResponseFinishStub.lastCall.args[1]).to.equal('function');
            onResponseFinishStub.lastCall.args[1]();
            expect(req.socket).to.deep.equal({
                _isIdle: true
            }, 'Socket should be idle');
        });

        // it('should safe shutdown server', (done: Function) => {
        //     const clock = sandbox.useFakeTimers(Date.now());
        //     let closeServerCallback: Function = null;
        //     let server: any = {
        //         on: sandbox.spy(),
        //         close: ((callback: () => void) => {
        //             closeServerCallback = callback;
        //         })
        //     };
        //     server = SafeShutdown.server(server);
        //     const socket: any = {on: () => {}, destroy: () => {}};
        //     server.on.firstCall.args[1](socket);
        //     clock.tick(260);
        //     server.safeShutdown().then(() => {
        //         done();
        //     }).catch((e: Error) => done(e));
        //     clock.tick(260);
        //     server.on.secondCall.args[1]({socket}, {on: () => {}});
        //
        //     clock.tick(500);
        //     closeServerCallback();
        // });
    });
});

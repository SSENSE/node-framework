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

        describe('safeShutdown()', async () => {
            it('should call close method on base server', (done: Function) => {
                sandbox.useFakeTimers(Date.now());
                let closeServerCallback: Function;
                const server = SafeShutdownServer.create(<any> {
                    close: (callback: Function) => {
                        closeServerCallback = callback;
                    },
                    on: sandbox.stub()
                });
                const closeSpy = sandbox.spy(server, 'close');
                server.safeShutdown().then(() => {
                    try {
                        expect(closeSpy.callCount).to.equal(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
                closeServerCallback();
            });

            it('should periodically check server connections', (done: Function) => {
                const clock = sandbox.useFakeTimers(Date.now());
                const setIntervalSpy = sandbox.spy(clock, 'setInterval');
                let closeServerCallback: Function;
                const server = SafeShutdownServer.create(<any> {
                    close: (callback: Function) => {
                        closeServerCallback = callback;
                    },
                    on: sandbox.stub()
                });
                server.safeShutdown().then(() => {
                    try {
                        expect(setIntervalSpy.callCount).to.equal(1);
                        expect(setIntervalSpy.lastCall.args[1]).to.equal(250);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
                closeServerCallback();
            });

            it('should wait for timeout before forcing shutting down the server', (done: Function) => {
                const clock = sandbox.useFakeTimers(Date.now());
                const setIntervalSpy = sandbox.spy(clock, 'setInterval');
                const setTimeoutSpy = sandbox.spy(clock, 'setTimeout');
                const clearTimeoutSpy = sandbox.spy(clock, 'clearTimeout');
                let closeServerCallback: Function;
                const server = SafeShutdownServer.create(<any> {
                    close: (callback: Function) => {
                        closeServerCallback = callback;
                    },
                    on: sandbox.stub()
                });
                server.safeShutdown(1000).then(() => {
                    try {
                        expect(setIntervalSpy.callCount).to.equal(1);
                        expect(setIntervalSpy.lastCall.args[1]).to.equal(250);
                        expect(setTimeoutSpy.callCount).to.equal(1);
                        expect(setTimeoutSpy.lastCall.args[1]).to.equal(1000);
                        expect(clearTimeoutSpy.callCount).to.equal(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
                clock.tick(1000);
                closeServerCallback();
            });

            it('should try to clean intervals and timeouts if an error occurs', async () => {
                const clock = sandbox.useFakeTimers(Date.now());
                const clearIntervalSpy = sandbox.spy(clock, 'clearInterval');
                const clearTimeoutSpy = sandbox.spy(clock, 'clearTimeout');
                const server = SafeShutdownServer.create(<any> {
                    close: sandbox.stub().throws(new Error('Foo')),
                    on: sandbox.stub()
                });
                let error: string = null;
                try {
                    await server.safeShutdown();
                } catch (e) {
                    error = e.message;
                }
                expect(clearIntervalSpy.callCount).to.equal(1);
                expect(clearTimeoutSpy.callCount).to.equal(0);
                expect(error).to.equal('Foo');
            });

            it('should clean idle sockets periodically', (done: Function) => {
                const clock = sandbox.useFakeTimers(Date.now());
                let closeServerCallback: Function;
                const server = SafeShutdownServer.create(<any> {
                    close: (callback: Function) => {
                        closeServerCallback = callback;
                    },
                    on: sandbox.spy()
                });
                const onServerConnection: Function = server.on.firstCall.args[1];
                const onServerRequest: Function = server.on.secondCall.args[1];
                const socket: any = {
                    on: sandbox.spy(),
                    destroy: sandbox.spy()
                };
                const request: any = {
                    socket
                };
                const response: any = {
                    on: sandbox.spy()
                };

                server.safeShutdown().then(() => {
                    try {
                        expect(socket.destroy.callCount).to.equal(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });

                onServerConnection(socket);
                onServerRequest(request, response);
                clock.tick(550);
                expect(socket.destroy.callCount).to.equal(0);
                response.on.lastCall.args[1]();
                clock.tick(250);
                closeServerCallback();
            });

            it('should clean all sockets after given timeout', (done: Function) => {
                const clock = sandbox.useFakeTimers(Date.now());
                let closeServerCallback: Function;
                const server = SafeShutdownServer.create(<any> {
                    close: (callback: Function) => {
                        closeServerCallback = callback;
                    },
                    on: sandbox.spy()
                });
                const onServerConnection: Function = server.on.firstCall.args[1];
                const onServerRequest: Function = server.on.secondCall.args[1];
                const socket: any = {
                    on: sandbox.spy(),
                    destroy: sandbox.spy()
                };
                const request: any = {
                    socket
                };
                const response: any = {
                    on: sandbox.spy()
                };

                server.safeShutdown(600).then(() => {
                    try {
                        expect(socket.destroy.callCount).to.equal(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });

                onServerConnection(socket);
                onServerRequest(request, response);
                clock.tick(550);
                expect(socket.destroy.callCount).to.equal(0);
                clock.tick(250);
                closeServerCallback();
            });
        });
    });
});

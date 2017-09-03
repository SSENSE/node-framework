import { expect } from 'chai';
import * as nock from 'nock';
import { Emitter, EmitterOptions } from '../../../src/pubsub/Emitter';

interface ChildData {
    host: string;
    accessToken: string;
    userAgent: string;
    port: number;
    secure: boolean;
    timeout: number;
    async: boolean;
    debug: boolean;
}

class EmitterChild extends Emitter {
    public getInfo(): ChildData {
        return {
            host: this.host,
            accessToken: this.accessToken,
            userAgent: this.userAgent,
            port: this.port,
            secure: this.secure,
            timeout: this.timeout,
            async: this.async,
            debug: this.debug
        };
    }
}

describe('PubsubEmitter', () => {
    describe('constructor()', () => {
        it('should throw an error if host is invalid', () => {
            expect(() => new Emitter(null)).to.throw('options.host is required');
            expect(() => new Emitter(<any> {host: '    '})).to.throw('options.host is required');
        });

        it('should throw an error if accessToken is invalid', () => {
            expect(() => new Emitter(<any> {host: 'foo'})).to.throw('options.accessToken is required');
        });

        it('should throw an error if userAgent is invalid', () => {
            expect(() => new Emitter(<any> {host: 'foo', accessToken: 'bar'})).to.throw('options.userAgent is required');
        });

        it('should set default values if options are missing', () => {
            const params: EmitterOptions = {
                host: 'host//////',
                accessToken: '  token ',
                userAgent: 'userAgent'
            };
            const emitter = new EmitterChild(params);
            expect(emitter.getInfo()).to.deep.equal({
                host: 'host',
                accessToken: 'token',
                userAgent: 'userAgent',
                port: 80,
                secure: false,
                timeout: 5000,
                async: false,
                debug: false
            }, 'Params should be as expected');
        });

        it('should set appropriate values according to options', () => {
            const params: EmitterOptions = {
                host: 'host//////',
                accessToken: '  token ',
                userAgent: 'userAgent',
                port: 444,
                secure: true,
                timeout: 2500,
                async: true,
                debug: true
            };
            const emitter = new EmitterChild(params);
            expect(emitter.getInfo()).to.deep.equal({
                host: 'host',
                accessToken: 'token',
                userAgent: 'userAgent',
                port: 444,
                secure: true,
                timeout: 2500,
                async: true,
                debug: true
            }, 'Params should be as expected');
        });
    });

    describe('emit()', () => {
        it('should throw an error if a technical error occurs', async () => {
            const emitter = new Emitter({host: 'foo.bar', userAgent: 'foo', accessToken: 'bar', port: 443});
            nock('https://foo.bar').post('/api/messages').replyWithError('foobar');
            let error: string = null;
            try {
                await emitter.emit('topic', null);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('foobar');
        });

        it('should throw a specific error if HTTP response code is greater than 399', async () => {
            const emitter = new Emitter({host: 'foo.bar', userAgent: 'foo', accessToken: 'bar', port: 443});
            nock('https://foo.bar').post('/api/messages').reply(404, 'foobar');
            let error: string = null;
            try {
                await emitter.emit('topic', null);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('An error occurred while sending pubsub message: foobar');
        });

        it('should throw a specific error if body response is invalid json', async () => {
            const emitter = new Emitter({host: 'foo.bar', userAgent: 'foo', accessToken: 'bar', port: 443, async: true});
            nock('https://foo.bar').post('/api/messages').reply(200, 'foobar');
            let error: string = null;
            try {
                await emitter.emit('topic', null);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Invalid response body received: foobar');
        });

        it('should throw a specific error if body response.status is not "success"', async () => {
            const emitter = new Emitter({host: 'foo.bar', userAgent: 'foo', accessToken: 'bar', port: 443, debug: true});
            nock('https://foo.bar').post('/api/messages').reply(200, JSON.stringify({status: 'bar', data: 'baz'}));
            let error: string = null;
            try {
                await emitter.emit('topic', null);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('baz');
        });

        it('should return message GUID on success', async () => {
            const emitter = new Emitter({host: 'foo.bar', userAgent: 'foo', accessToken: 'bar', port: 443, debug: true});
            nock('https://foo.bar').post('/api/messages').reply(200, JSON.stringify({status: 'success', data: {msg_guid: 'guid'}}));
            const result = await emitter.emit('topic', null);
            expect(result).to.equal('guid');
        });
    });
});

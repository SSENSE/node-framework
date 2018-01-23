import { expect } from 'chai';
import * as sinon from 'sinon';
import * as nock from 'nock';
import * as KeepAliveAgent from 'agentkeepalive';
import { Base as Exception } from '../../../src/exceptions/Base';
import { BadRequestException } from '../../../src/exceptions/Exceptions';
import { Client, ClientType } from '../../../src/http/Client';

let sandbox: sinon.SinonSandbox;

class TestClient extends Client {
    public getBaseUri(): string {
        return (<any> this).baseUri;
    }

    public getAgent(): any {
        return (<any> this).agent;
    }

    public getStatusHandler(): any {
        return (<any> this).statusHandler;
    }
}

describe('HttpClient', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });

    describe('constructor()', () => {
        it('should throw an error if options.host is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client(<any> {host: '  '});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.host is mandatory');
        });

        it('should throw an error if options.userAgent is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client({host: 'www.foo.bar', userAgent: '  '});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.userAgent is mandatory');
        });

        it('should throw an error if options.port is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client({host: 'www.foo.bar', userAgent: 'foo', port: 100000});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.port is invalid');
        });

        it('should throw an error if options.timeout is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client({host: 'www.foo.bar', userAgent: 'foo', timeout: -1});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.timeout is invalid');
        });

        it('should throw an error if options.retries is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client({host: 'www.foo.bar', userAgent: 'foo', retries: -1});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.retries is invalid');
        });

        it('should throw an error if options.clientType is invalid', () => {
            let error: string = null;
            try {
                // tslint:disable-next-line:no-unused-expression
                new Client(<any> {host: 'www.foo.bar', userAgent: 'foo', clientType: 2});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('options.clientType is invalid');
        });

        it('should set appropriate values depending on options and default values', () => {
            let client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                keepAlive: false
            });
            expect(client.getBaseUri()).to.equal('http://www.foo.bar/'); // tslint:disable-line:no-http-string

            client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                port: 443,
                keepAlive: false
            });
            expect(client.getBaseUri()).to.equal('https://www.foo.bar/');

            client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                port: 8080,
                secure: true,
                keepAlive: false
            });
            expect(client.getBaseUri()).to.equal('https://www.foo.bar:8080/');
        });

        it('should create a keep alive agent by default', () => {
            const client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo'
            });
            expect(client.getAgent()).to.be.instanceof(KeepAliveAgent);
        });

        it('should switch between basic and secure keep alive agents depending on options', () => {
            const spy = sandbox.stub(KeepAliveAgent, 'HttpsAgent');
            // tslint:disable-next-line:no-unused-expression
            new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo'
            });
            expect(spy.callCount).to.equal(0);

            // tslint:disable-next-line:no-unused-expression
            new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                secure: true
            });
            expect(spy.callCount).to.equal(1);
        });

        it('should use default keep alive refesh value if no option is provided', () => {
            const spy = sandbox.stub(KeepAliveAgent, 'HttpsAgent');
            // tslint:disable-next-line:no-unused-expression
            new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                secure: true
            });
            expect(spy.callCount).to.equal(1);
            expect(spy.lastCall.args).to.deep.equal([{
                keepAlive: true,
                socketActiveTTL: 60000
            }], 'Params should be as expected');
        });

        it('should use keep alive refesh value from options if provided', () => {
            const spy = sandbox.stub(KeepAliveAgent, 'HttpsAgent');
            // tslint:disable-next-line:no-unused-expression
            new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo',
                secure: true,
                keepAliveRefresh: 30000
            });
            expect(spy.callCount).to.equal(1);
            expect(spy.lastCall.args).to.deep.equal([{
                keepAlive: true,
                socketActiveTTL: 30000
            }], 'Params should be as expected');
        });
    });

    describe('afterRequest()', () => {
        it('should set status handler callback', () => {
            const client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'foo'
            });
            expect(client.getStatusHandler()).to.equal(undefined, 'Client status handler should be undefined');

            const spy: any = sandbox.spy();
            client.afterRequest(spy);
            expect(client.getStatusHandler()).to.equal(spy);
        });
    });

    describe('sendRequest()', () => {
        it('should set appropriate request options according to client options', async () => {
            const client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                keepAlive: false
            });
            const stub = sandbox.stub(client, <any> 'executeRequest');
            await client.sendRequest('foo', 'bar');
            expect(stub.callCount).to.equal(1);
            expect(stub.lastCall.args).to.deep.equal([
                'GET', {
                    method: 'GET',
                    url: 'http://www.foo.bar/bar', // tslint:disable-line:no-http-string
                    headers: { 'User-Agent': 'userAgent', 'X-Request-Id': 'foo' },
                    timeout: 5000,
                    json: true
                }
            ], 'Request options should be as expected');
        });

        it('should add extra request headers if present', async () => {
            const client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent'
            });
            const stub = sandbox.stub(client, <any> 'executeRequest');
            await client.sendRequest('foo', 'bar', 'GET', {headers: {foo: 'bar'}});
            expect(stub.callCount).to.equal(1);
            expect(stub.lastCall.args[1].headers).to.deep.equal({
                'User-Agent': 'userAgent',
                'X-Request-Id': 'foo',
                'foo': 'bar'
            });
        });

        it('should add request body if present', async () => {
            const stub = sandbox.stub(TestClient.prototype, <any> 'executeRequest');
            let client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent'
            });
            await client.sendRequest('foo', 'bar', 'GET', {body: {foo: 'bar'}});
            expect(stub.callCount).to.equal(1);
            expect(stub.lastCall.args[1].form).to.equal(undefined, 'form param should be undefined');
            expect(stub.lastCall.args[1].body).to.deep.equal({
                foo: 'bar'
            });

            client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                clientType: ClientType.UrlEncodedForm
            });
            await client.sendRequest('foo', 'bar', 'GET', {body: {foo: 'bar'}});
            expect(stub.callCount).to.equal(2);
            expect(stub.lastCall.args[1].body).to.equal(undefined, 'body param should be undefined');
            expect(stub.lastCall.args[1].form).to.deep.equal({
                foo: 'bar'
            });
        });

        it('should retry requests if retries option > 0', async () => {
            const stub = sandbox.stub(TestClient.prototype, <any> 'executeRequest').throws(new Error('Foo'));
            let client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent'
            });

            let error: string = null;
            try {
                await client.sendRequest('foo', 'bar', 'GET', {body: {foo: 'bar'}});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
            expect(stub.callCount).to.equal(1);

            client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                retries: 2 // Retry 2 times, so 3 calls in total
            });

            try {
                await client.sendRequest('foo', 'bar', 'GET', {body: {foo: 'bar'}});
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
            expect(stub.callCount).to.equal(4);
        });

        it('should call request status callback if defined', async () => {
            sandbox.useFakeTimers(Date.now());
            const spy = sandbox.spy();
            const stub = sandbox.stub(TestClient.prototype, <any> 'executeRequest');
            const client = new TestClient({
                host: 'www.foo.bar',
                userAgent: 'userAgent'
            });
            client.afterRequest(spy);
            await client.sendRequest('foo', 'bar');
            expect(stub.callCount).to.equal(1);
            expect(spy.callCount).to.equal(1);
            expect(spy.lastCall.args).to.deep.equal([{
                method: 'GET',
                url: 'http://www.foo.bar/bar', // tslint:disable-line:no-http-string
                requestId: 'foo',
                attempt: 1,
                duration: 0
            }]);

            stub.throws(new Error('Bar'));
            let error: string = null;
            try {
                await client.sendRequest('foo', 'bar');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Bar');
            expect(stub.callCount).to.equal(2);
            expect(spy.callCount).to.equal(2);
            expect(spy.lastCall.args).to.deep.equal([{
                method: 'GET',
                url: 'http://www.foo.bar/bar', // tslint:disable-line:no-http-string
                requestId: 'foo',
                attempt: 1,
                duration: 0,
                errorMessage: 'Bar'
            }]);
        });
    });

    describe('executeRequest()', () => {
        it('should throw an HTTP 500 error if a technical error occurs', async () => {
            nock('https://www.foo.bar').post('/baz').replyWithError('Foo');
            const client = new Client({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                secure: true
            });

            let error: any = null;
            try {
                await client.sendRequest('foo', 'baz', 'POST');
            } catch (e) {
                error = e;
            }
            expect(error).to.be.instanceof(Exception);
            expect(error.message).to.equal('Foo');
            expect(error.statusCode).to.equal(500);
            expect(error.details).to.deep.equal({
                method: 'POST',
                url: 'https://www.foo.bar/baz'
            });
        });

        it('should throw specific HTTP errors depending on HTTP response code', async () => {
            nock('https://www.foo.bar').post('/baz').reply(400, 'foo');
            const client = new Client({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                secure: true
            });

            let error: any = null;
            try {
                await client.sendRequest('foo', 'baz', 'POST');
            } catch (e) {
                error = e;
            }
            expect(error).to.be.instanceof(BadRequestException);
            expect(error.message).to.equal('An error occurred while sending HTTP request');
            expect(error.statusCode).to.equal(400);
            expect(error.code).to.equal('BadRequest');
            expect(error.details).to.deep.equal({
                method: 'POST',
                url: 'https://www.foo.bar/baz',
                response: 'foo'
            });
        });

        it('should return request reponse on success', async () => {
            nock('https://www.foo.bar').post('/baz').reply(200, {foo: 'bar'}, {bar: 'foo'});
            const client = new Client({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                secure: true
            });

            const response = await client.sendRequest('foo', 'baz', 'POST');
            expect(response).to.deep.equal({
                statusCode: 200,
                headers: { bar: 'foo', 'content-type': 'application/json' },
                body: { foo: 'bar' }
            });
        });

        it('should automatically decode JSON response if valid', async () => {
            nock('https://www.foo.bar').post('/baz').reply(200, '{"foo": "bar"}', {bar: 'foo'});
            const client = new Client({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                secure: true
            });

            const response = await client.sendRequest('foo', 'baz', 'POST');
            expect(response).to.deep.equal({
                statusCode: 200,
                headers: { bar: 'foo' },
                body: { foo: 'bar' }
            });
        });

        it('should not fail when trying to parse JSON response if invalid and return body as a string instead', async () => {
            nock('https://www.foo.bar').post('/baz').reply(200, '{', {bar: 'foo'});
            const client = new Client({
                host: 'www.foo.bar',
                userAgent: 'userAgent',
                secure: true
            });

            const response = await client.sendRequest('foo', 'baz', 'POST');
            expect(response).to.deep.equal({
                statusCode: 200,
                headers: { bar: 'foo' },
                body: '{'
            });
        });
    });
});

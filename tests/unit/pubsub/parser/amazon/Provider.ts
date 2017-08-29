import { expect } from 'chai';
import * as sinon from 'sinon';
import * as crypto from 'crypto';
import { Provider } from '../../../../../src/pubsub/parser/amazon/Provider';
import { Message } from '../../../../../src/pubsub/parser/amazon/Message';
import { Helper } from '../../../../../src/pubsub/parser/Helper';

let sandbox: sinon.SinonSandbox;

describe('AmazonProvider', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('setMessageParseFunction()', () => {
        it('should update message parsing function', () => {
            const spy = sandbox.spy();
            const provider = new Provider();
            provider.setMessageParseFunction(spy);
            expect((<any> provider).messageParseFunction).to.equal(spy);
        });
    });

    describe('canHandle()', () => {
        it('should not handle empty messages', () => {
            const provider = new Provider();
            expect(provider.canHandle(null)).to.equal(false, 'Provider should not handle empty messages');
            expect(provider.canHandle({})).to.equal(false, 'Provider should not handle empty messages');
        });

        it('should check all message properties', () => {
            const message: any = {
                Message: 'foo',
                MessageId: 'foo',
                Signature: 'foo',
                SignatureVersion: 'foo',
                SigningCertURL: 'foo',
                Timestamp: 'foo',
                TopicArn: 'foo',
            };
            const provider = new Provider();
            expect(provider.canHandle(message)).to.equal(false, 'Provider should not handle messages with missing properties');

            message.Type = null;
            expect(provider.canHandle(message)).to.equal(false, 'Provider should not handle messages with empty properties');

            message.Type = 'foo';
            expect(provider.canHandle(message)).to.equal(true, 'Provider should handle messages with all properties');
        });
    });

    describe('parse()', () => {
        const baseMessage: any = {
            Type: 'SubscriptionConfirmation',
            MessageId: 'id',
            Token: 'token',
            TopicArn: 'topic',
            Message: 'message',
            SubscribeURL: 'https://foo.bar',
            Timestamp: '2017-08-29T17:53:04.880Z',
            SignatureVersion: '1',
            Signature: 'baz',
            SigningCertURL: 'https://sns.us-west-2.amazonaws.com/SimpleNotificationService.pem'
        };

        it('should throw an error if signature version is invalid', async () => {
            const message = Object.assign({}, baseMessage, {SignatureVersion: '2'});
            const provider = new Provider();
            let error: string = null;
            try {
                await provider.parse(message);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Signature version "2" is not supported');
        });

        it('should throw an error if certificate url doesn\'t belong to Amazon', async () => {
            const message = Object.assign({}, baseMessage, {SigningCertURL: 'https://foo.bar'});
            const provider = new Provider();
            let error: string = null;
            try {
                await provider.parse(message);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Certificate url does not belong to Amazon, message could have been altered');
        });

        it('should throw an error if message type is invalid', async () => {
            const message = Object.assign({}, baseMessage, {Type: 'Foo'});
            const provider = new Provider();
            let error: string = null;
            try {
                await provider.parse(message);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Message with type "Foo" is not supported');
        });

        it('should try to retrieve amazon certificate and throw an error if invalid', async () => {
            const message = Object.assign({}, baseMessage);
            sandbox.stub(Helper, 'getUrl').returns(null);
            const provider = new Provider();
            let error: string = null;
            try {
                await provider.parse(message);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Invalid remote certificate retrieved from Amazon');
        });

        it('should try to retrieve amazon certificate only if it\'s not stored in cache', async () => {
            const message = Object.assign({}, baseMessage);
            const getUrlStub = sandbox.stub(Helper, 'getUrl').returns('foo');
            const createVerifyStub = sandbox.stub(crypto, 'createVerify').returns({
                update: sandbox.stub(),
                verify: sandbox.stub().returns(true)
            });
            const provider = new Provider();
            await provider.parse(message);
            expect(getUrlStub.callCount).to.equal(1);
            expect(createVerifyStub.callCount).to.equal(1);

            await provider.parse(message);
            expect(getUrlStub.callCount).to.equal(1);
            expect(createVerifyStub.callCount).to.equal(2);
        });

        it('should compute different message signature payload according to message type', async () => {
            const message = Object.assign({}, baseMessage);
            sandbox.stub(Helper, 'getUrl').returns('foo');
            const updatePayloadStub = sandbox.stub();
            sandbox.stub(crypto, 'createVerify').returns({
                update: updatePayloadStub,
                verify: sandbox.stub().returns(true)
            });

            const provider = new Provider();
            await provider.parse(message);
            expect(updatePayloadStub.callCount).to.equal(1);
            expect(updatePayloadStub.lastCall.args[0]).to.contain('Token');

            message.Type = 'Notification';
            await provider.parse(message);
            expect(updatePayloadStub.callCount).to.equal(2);
            expect(updatePayloadStub.lastCall.args[0]).to.not.contain('Token');
            expect(updatePayloadStub.lastCall.args[0]).to.not.contain('Subject');

            message.Subject = 'Subject';
            await provider.parse(message);
            expect(updatePayloadStub.callCount).to.equal(3);
            expect(updatePayloadStub.lastCall.args[0]).to.not.contain('Token');
            expect(updatePayloadStub.lastCall.args[0]).to.contain('Subject');
        });

        it('should throw an error if message signature is invalid', async() => {
            const message = Object.assign({}, baseMessage);
            sandbox.stub(Helper, 'getUrl').returns('foo');
            sandbox.stub(crypto, 'createVerify').returns({
                update: sandbox.stub(),
                verify: sandbox.stub().returns(false)
            });
            const provider = new Provider();
            let error: string = null;
            try {
                await provider.parse(message);
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Invalid message signature, message could have been altered');
        });

        it('should call personalized parse function if present', async () => {
            const message = Object.assign({}, baseMessage);
            message.Message = 'foo';
            sandbox.stub(Helper, 'getUrl').returns('foo');
            sandbox.stub(crypto, 'createVerify').returns({
                update: sandbox.stub(),
                verify: sandbox.stub().returns(true)
            });
            const provider = new Provider();
            provider.setMessageParseFunction((input) => `hello${input}world`);
            const result = await provider.parse(message);
            expect(result).to.haveOwnProperty('data');
            expect(result.data).to.equal('hellofooworld');
        });

        it('should set subscribe and unsubscribe urls if present', async () => {
            const message = Object.assign({}, baseMessage, {SubscribeURL: 'foo', UnsubscribeURL: 'bar'});
            sandbox.stub(Helper, 'getUrl').returns('foo');
            sandbox.stub(crypto, 'createVerify').returns({
                update: sandbox.stub(),
                verify: sandbox.stub().returns(true)
            });
            const setSubscribeStub = sandbox.stub(Message.prototype, 'setSubscribeUrl');
            const setUnsubscribeStub = sandbox.stub(Message.prototype, 'setUnsubscribeUrl');
            const provider = new Provider();
            await provider.parse(message);
            expect(setSubscribeStub.callCount).to.equal(1);
            expect(setSubscribeStub.lastCall.args).to.deep.equal(['foo']);
            expect(setUnsubscribeStub.callCount).to.equal(1);
            expect(setUnsubscribeStub.lastCall.args).to.deep.equal(['bar']);
        });

        it('should not set subscribe and unsubscribe urls if not present', async () => {
            const message = Object.assign({}, baseMessage);
            delete message.SubscribeURL;
            delete message.UnsubscribeURL;
            sandbox.stub(Helper, 'getUrl').returns('foo');
            sandbox.stub(crypto, 'createVerify').returns({
                update: sandbox.stub(),
                verify: sandbox.stub().returns(true)
            });
            const setSubscribeStub = sandbox.stub(Message.prototype, 'setSubscribeUrl');
            const setUnsubscribeStub = sandbox.stub(Message.prototype, 'setUnsubscribeUrl');
            const provider = new Provider();
            await provider.parse(message);
            expect(setSubscribeStub.callCount).to.equal(0);
            expect(setUnsubscribeStub.callCount).to.equal(0);
        });
    });
});

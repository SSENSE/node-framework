import { expect } from 'chai';
import * as sinon from 'sinon';
import { Message } from '../../../../../src/pubsub/parser/amazon/Message';
import { Helper } from '../../../../../src/pubsub/parser/Helper';

let sandbox: sinon.SinonSandbox;

class MessageChild extends Message {
    public getSubscribe(): string {
        return this.subscribeUrl;
    }

    public getUnsubscribe(): string {
        return this.unsubscribeUrl;
    }
}

describe('AmazonMessage', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('setSubscribeUrl()', () => {
        it('should set subscribe url', () => {
            const message = new MessageChild();
            message.setSubscribeUrl('foo');
            expect(message.getSubscribe()).to.equal('foo');
        });
    });

    describe('setUnsubscribeUrl()', () => {
        it('should set unsubscribe url', () => {
            const message = new MessageChild();
            message.setUnsubscribeUrl('foo');
            expect(message.getUnsubscribe()).to.equal('foo');
        });
    });

    describe('subscribeToTopic()', () => {
        it('should only try to subscribe to topic if subscribeUrl is present', () => {
            const getUrlStub = sandbox.stub(Helper, 'getUrl');
            const message = new MessageChild();

            message.subscribeToTopic();
            expect(getUrlStub.callCount).to.equal(0);

            message.setSubscribeUrl('foo');
            message.subscribeToTopic();
            expect(getUrlStub.callCount).to.equal(1);
        });
    });

    describe('unsubscribeFromTopic()', () => {
        it('should only try to unsubscribe from topic if unsubscribeUrl is present', () => {
            const getUrlStub = sandbox.stub(Helper, 'getUrl');
            const message = new MessageChild();

            message.unsubscribeFromTopic();
            expect(getUrlStub.callCount).to.equal(0);

            message.setUnsubscribeUrl('foo');
            message.unsubscribeFromTopic();
            expect(getUrlStub.callCount).to.equal(1);
        });
    });
});

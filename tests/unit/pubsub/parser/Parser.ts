import { expect } from 'chai';
import * as sinon from 'sinon';
import { Parser } from '../../../../src/pubsub/parser/Parser';
import { Provider as AmazonProvider } from '../../../../src/pubsub/parser/amazon/Provider';

let sandbox: sinon.SinonSandbox;

describe('PubsubParser', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should initialize providers', () => {
            const parser = new Parser();
            expect((<any> parser).providers).to.be.instanceof(Array);
            expect((<any> parser).providers.length).to.equal(1);
        });
    });

    describe('setMessageParseFunction()', () => {
        it('should update message parsing function for all providers', () => {
            const setMessageParseStub = sandbox.stub(AmazonProvider.prototype, 'setMessageParseFunction');
            const parser = new Parser();
            parser.setMessageParseFunction(null);
            expect(setMessageParseStub.callCount).to.equal(1);
        });
    });

    describe('parse()', () => {
        it('should call throw an error if no provider is able to handle a message', async () => {
            const canHandleStub = sandbox.stub(AmazonProvider.prototype, 'canHandle').returns(false);
            const parser = new Parser();
            let error: string = null;
            try {
                await parser.parse(null);
            } catch (e) {
                error = e.message;
            }
            expect(canHandleStub.callCount).to.equal(1);
            expect(error).to.equal('Message not supported');
        });

        it('should call parse method on corresponding provider is message is supported', async () => {
            const canHandleStub = sandbox.stub(AmazonProvider.prototype, 'canHandle').returns(true);
            const parseStub = sandbox.stub(AmazonProvider.prototype, 'parse').returns({foo: 'bar'});
            const parser = new Parser();
            const result = await parser.parse(null);
            expect(canHandleStub.callCount).to.equal(1);
            expect(parseStub.callCount).to.equal(1);
            expect(result).to.deep.equal({foo: 'bar'});
        });
    });
});

import { expect } from 'chai';
import * as nock from 'nock';
import { SlackNotifier } from '../../../src/http/SlackNotifier';

describe('SlackNotifier', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    describe('constructor()', () => {
        it('should throw errors if arguments are invalid', () => {
            // tslint:disable-next-line:max-line-length
            expect(() => new SlackNotifier(null, null, null)).to.throw('webHookUrl must be a valid string starting with "https://hooks.slack.com"');
            // tslint:disable-next-line:max-line-length
            expect(() => new SlackNotifier('foo', null, null)).to.throw('webHookUrl must be a valid string starting with "https://hooks.slack.com"');
            const url = 'https://hooks.slack.com/foo';
            expect(() => new SlackNotifier(url, null, null)).to.throw('defaultDestination must be a valid string starting with "#" or "@"');
            expect(() => new SlackNotifier(url, 'foo', null)).to.throw(
                'defaultDestination must be a valid string starting with "#" or "@"'
            );
            expect(() => new SlackNotifier(url, '#foo', null)).to.throw('userName is required');
            expect(() => new SlackNotifier(url, '@foo', '  ')).to.throw('userName is required');
        });
    });

    describe('send()', () => {
        it('should throw an error if a technical error occurs', async () => {
            nock('https://hooks.slack.com').post('/foo').replyWithError('Foo');
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            let error: string = null;
            try {
                await slack.send('message');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
        });

        it('should throw an error if response code is invalid', async () => {
            nock('https://hooks.slack.com').post('/foo').reply(400, 'Bar');
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            let error: string = null;
            try {
                await slack.send('message');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('An error occurred while sending slack notification: Bar');
        });

        it('should not send error if message send if successful', async () => {
            nock('https://hooks.slack.com').post('/foo').reply(200);
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            let error: string = null;
            try {
                await slack.send('message');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal(null, 'No error should have been thrown');
        });

        it('should override default destination if a different destination is given in params', async () => {
            let reqBody: any = null;
            nock('https://hooks.slack.com').post('/foo').reply((uri, body) => {
                reqBody = body;
                return 200;
            });
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            await slack.send('message', null, '#baz');
            expect(reqBody.channel).to.equal('#baz');
        });

        it('should throw an error if specific destination is invalid', async () => {
            let error: string = null;
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            try {
                await slack.send('message', null, '');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('destination must be a valid string starting with "#" or "@"');
        });

        it('should add message detail if given in params', async () => {
            let reqBody: any = null;
            nock('https://hooks.slack.com').post('/foo').reply((uri, body) => {
                reqBody = body;
                return 200;
            });
            const slack = new SlackNotifier('https://hooks.slack.com/foo', '#foo', 'bar');
            await slack.send('message', 'foobar');
            expect(reqBody.attachments).to.deep.equal([{
                title: 'Detail',
                text: 'foobar'
            }]);
        });
    });
});

import { expect } from 'chai';
import * as nock from 'nock';
import { Helper } from '../../../../src/pubsub/parser/Helper';

describe('PubsubHelper', () => {
    describe('getUrl()', () => {
        it('should throw an error if a technical error occurs', async () => {
            nock('https://foo.bar').get('/baz').replyWithError('Foo');
            let error: string = null;
            try {
                await Helper.getUrl('https://foo.bar/baz');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Foo');
        });

        it('should throw a specific error if HTTP code is greater than 400', async () => {
            nock('https://foo.bar').get('/baz').reply(400, 'Bar');
            let error: string = null;
            try {
                await Helper.getUrl('https://foo.bar/baz');
            } catch (e) {
                error = e.message;
            }
            expect(error).to.equal('Received status code 400 when trying to get https://foo.bar/baz');
        });

        it('should return response body if successful', async () => {
            nock('https://foo.bar').get('/baz').reply(200, 'Baz');
            const result = await Helper.getUrl('https://foo.bar/baz');
            expect(result).to.equal('Baz');
        });
    });
});

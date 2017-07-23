import { expect } from 'chai';
import { BaseLog } from '../../../src/logger/BaseLog';

let initialEnv: string;

describe('BaseLog', () => {
    before(() => {
        initialEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env.NODE_ENV = initialEnv;
    });

    describe('constructor()', () => {
        it('should set appropriate default values', () => {
            const log = new BaseLog('foo');
            expect(log.app).to.equal('foo');
            expect(log.service).to.equal('node');
            expect(log.env).to.equal(process.env.NODE_ENV);
        });

        it('should set correct env param', () => {
            process.env.NODE_ENV = '  PRoDuCTion   ';
            delete (<any> BaseLog).standardEnv;
            let log = new BaseLog('foo');
            expect(log.env).to.equal('prod');

            process.env.NODE_ENV = '  devElopMent   ';
            delete (<any> BaseLog).standardEnv;
            log = new BaseLog('foo');
            expect(log.env).to.equal('dev');

            delete(process.env.NODE_ENV);
            delete (<any> BaseLog).standardEnv;
            log = new BaseLog('foo');
            expect(log.env).to.equal(null, 'log.env should be null');
        });
    });
});

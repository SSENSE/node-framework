import { expect } from 'chai';
import * as sinon from 'sinon';
import { Base } from '../../../src/exceptions/Base';
import { BadRequestException, ConflictException, ForbiddenException, MethodNotAllowedException, NotFoundException,
    TooManyRequestsException, UnauthorizedException } from '../../../src/exceptions/Exceptions';

let sandbox: sinon.SinonSandbox;

describe('Exceptions', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Exception', () => {
        describe('constructor()', () => {
            it('should have default statusCode and code', () => {
                const exception = new Base('foo');
                expect(exception.statusCode).to.equal(500);
                expect(exception.code).to.equal('InternalError');
            });

            it('should return json object when getting body', () => {
                const exception = new Base('foo', 'bar');
                expect(exception.statusCode).to.equal(500);
                expect(exception.body).to.deep.equal({
                    code: 'bar',
                    message: 'foo'
                });
            });

            it('should return specific details in body if existing', () => {
                const exception = new Base('foo', 'bar', {foo: 'bar'});
                expect(exception.statusCode).to.equal(500);
                expect(exception.body).to.deep.equal({
                    code: 'bar',
                    message: 'foo',
                    details: {
                        foo: 'bar'
                    }
                });
            });

            it('should compute body on the flight and do it once', () => {
                const spy = sandbox.spy(Object, 'assign');
                const exception = new Base('foo', 'bar', {foo: 'bar'});
                expect(exception.body).to.be.an('object');
                expect(spy.callCount).to.equal(1);
                expect(exception.body).to.be.an('object');
                expect(spy.callCount).to.equal(1);
            });
        });

        describe('fromHttpCode()', () => {
            it('should create a base Exception from HTTP code', () => {
                const exception = Base.fromHttpCode(900, 'baz', null, {bar: 'foo'});
                expect(exception).to.be.an.instanceOf(Base);
            });

            it('should have default statusCode and code', () => {
                const exception = Base.fromHttpCode(null, 'baz', null, {bar: 'foo'});
                expect(exception.statusCode).to.equal(500);
                expect(exception.code).to.equal('InternalError');
            });

            it('should return a typed Exception based on HTTP code if existing', () => {
                let exception = Base.fromHttpCode(400, 'foobar');
                expect(exception.statusCode).to.equal(400);
                expect(exception.code).to.equal('BadRequest');
                expect(exception).to.be.an.instanceOf(BadRequestException);

                exception = Base.fromHttpCode(403, 'foobar');
                expect(exception.statusCode).to.equal(403);
                expect(exception.code).to.equal('Forbidden');
                expect(exception).to.be.an.instanceOf(ForbiddenException);
            });
        });

        describe('toJSON()', () => {
            it('should return the exception body', () => {
                const exception = new Base('foo', 'bar');
                expect(exception.statusCode).to.equal(500);
                expect(exception.toJSON()).to.deep.equal({
                    code: 'bar',
                    message: 'foo'
                });
            });
        });
    });

    describe('BadRequestException', () => {
        it('should have default statusCode and code', () => {
            const exception = new BadRequestException('foo');
            expect(exception.statusCode).to.equal(400);
            expect(exception.code).to.equal('BadRequest');
        });
    });

    describe('ConflictException', () => {
        it('should have default statusCode and code', () => {
            const exception = new ConflictException('foo');
            expect(exception.statusCode).to.equal(409);
            expect(exception.code).to.equal('Conflict');
        });
    });

    describe('ForbiddenException', () => {
        it('should have default statusCode and code', () => {
            const exception = new ForbiddenException('foo');
            expect(exception.statusCode).to.equal(403);
            expect(exception.code).to.equal('Forbidden');
        });
    });

    describe('MethodNotAllowedException', () => {
        it('should have default statusCode and code', () => {
            const exception = new MethodNotAllowedException('foo');
            expect(exception.statusCode).to.equal(405);
            expect(exception.code).to.equal('MethodNotAllowed');
        });
    });

    describe('NotFoundException', () => {
        it('should have default statusCode and code', () => {
            const exception = new NotFoundException('foo');
            expect(exception.statusCode).to.equal(404);
            expect(exception.code).to.equal('NotFound');
        });
    });

    describe('TooManyRequestsException', () => {
        it('should have default statusCode and code', () => {
            const exception = new TooManyRequestsException('foo');
            expect(exception.statusCode).to.equal(429);
            expect(exception.code).to.equal('TooManyRequests');
        });
    });

    describe('UnauthorizedException', () => {
        it('should have default statusCode and code', () => {
            const exception = new UnauthorizedException('foo');
            expect(exception.statusCode).to.equal(401);
            expect(exception.code).to.equal('Unauthorized');
        });
    });
});

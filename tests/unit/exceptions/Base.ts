import { expect } from 'chai';
import { Base } from '../../../src/exceptions/Base';
import { BadRequestException, ConflictException, ForbiddenException, MethodNotAllowedException, NotFoundException,
    TooManyRequestsException, UnauthorizedException } from '../../../src/exceptions/Exceptions';

describe('Exceptions', () => {
    describe('Exception', () => {
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

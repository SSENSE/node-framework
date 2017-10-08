import { expect } from 'chai';
import { ValidationError, FieldValidationError } from '../../../../src/http/validation/ValidationError';

describe('Validation errors', () => {
    describe('ValidationError', () => {
        describe('constructor()', () => {
            it('should return a ValidationError', () => {
                const error = new ValidationError();
                expect(error.message).to.equal('Request contains validation errors');
                expect(error.errors).to.deep.equal([]);
            });

            it('should accept FieldValidationError params', () => {
                const e: any = 'foo';
                const error = new ValidationError([e]);
                expect(error.message).to.equal('Request contains validation errors');
                expect(error.errors).to.deep.equal([e]);
            });
        });
    });

    describe('FieldValidationError', () => {
        describe('constructor()', () => {
            it('should return a FieldValidationError', () => {
                const error = new FieldValidationError('field', 'location');
                expect(error.field).to.equal('field');
                expect(error.location).to.equal('location');
                expect(error.messages).to.deep.equal([]);
            });
        });
    });
});

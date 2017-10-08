"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(errors) {
        super('Request contains validation errors');
        this.errors = errors || [];
    }
}
exports.ValidationError = ValidationError;
class FieldValidationError {
    constructor(field, location) {
        this.messages = [];
        this.field = field;
        this.location = location;
    }
}
exports.FieldValidationError = FieldValidationError;
//# sourceMappingURL=ValidationError.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = require("./ValidationError");
class RequestValidator {
    static validate(validation) {
        const internalValidation = RequestValidator.cleanValidation(validation);
        return (request, response, callback) => {
            if (internalValidation) {
                let errors = [];
                Object.keys(internalValidation).forEach(key => {
                    errors = errors.concat(RequestValidator.validateEntity(key, request[key], internalValidation[key]));
                });
                if (errors.length > 0) {
                    return callback(new ValidationError_1.ValidationError(errors));
                }
            }
            return callback();
        };
    }
    static cleanValidation(validation) {
        const result = {};
        if (validation) {
            Object.keys(validation).forEach(key => {
                if (['headers', 'params', 'query', 'body'].indexOf(key) >= 0 && validation[key]) {
                    const entity = {};
                    Object.keys(validation[key]).forEach(paramKey => {
                        const param = RequestValidator.cleanValidationParam(validation[key][paramKey]);
                        if (param) {
                            entity[paramKey] = param;
                        }
                    });
                    if (Object.keys(entity).length > 0) {
                        result[key] = entity;
                    }
                }
            });
        }
        return Object.keys(result).length > 0 ? result : null;
    }
    static cleanValidationParam(param) {
        if (!param || !param.type || ['string', 'number', 'boolean', 'numeric', 'date', 'array', 'object'].indexOf(param.type) < 0) {
            return null;
        }
        const result = { type: param.type };
        if (typeof param.required === 'boolean') {
            result.required = param.required;
        }
        if (typeof param.min === 'number') {
            result.min = param.min;
        }
        if (typeof param.max === 'number') {
            result.max = param.max;
        }
        if (typeof param.length === 'number') {
            result.length = param.length;
        }
        if (['string', 'number', 'boolean', 'numeric'].indexOf(param.arrayType) >= 0) {
            result.arrayType = param.arrayType;
            result.arraySeparator = typeof param.arraySeparator === 'string' ? param.arraySeparator : ',';
        }
        if (Array.isArray(param.values)) {
            result.values = param.values;
        }
        if (param.regex instanceof RegExp) {
            result.regex = param.regex;
        }
        if (typeof param.format === 'function') {
            result.format = param.format;
        }
        return result;
    }
    static validateEntity(entityKey, entity, params) {
        const errors = [];
        for (const key of Object.keys(params)) {
            const error = new ValidationError_1.FieldValidationError(key, entityKey);
            const param = params[key];
            let value = entity && entity[key] != null ? entity[key] : undefined;
            if (param.required && value === undefined) {
                error.messages.push('Field required');
            }
            if (value !== undefined) {
                if (param.arraySeparator && param.type === 'array' && ['headers', 'params', 'query'].indexOf(entityKey) >= 0
                    && typeof value === 'string') {
                    value = entity[key] = value.split(param.arraySeparator);
                }
                const typeValidation = { type: param.type, value, formatted: null };
                if (RequestValidator.checkType(typeValidation) !== true) {
                    error.messages.push(`Invalid type, expecting ${param.type}`);
                }
                if (typeValidation.formatted != null) {
                    value = entity[key] = typeValidation.formatted;
                }
                if (param.min && RequestValidator.checkMin(value, param.min) !== true) {
                    error.messages.push(`Invalid minimum, expecting >= ${param.min}`);
                }
                if (param.max && RequestValidator.checkMax(value, param.max) !== true) {
                    error.messages.push(`Invalid maximum, expecting <= ${param.max}`);
                }
                if (param.length && RequestValidator.checkLength(value, param.length) !== true) {
                    error.messages.push(`Invalid length, expecting ${param.length}`);
                }
                const arrayTypeValidation = { type: param.arrayType, value, formatted: null };
                if (param.arrayType && Array.isArray(value) && RequestValidator.checkArrayType(arrayTypeValidation) !== true) {
                    error.messages.push(`Invalid array type, expecting ${param.arrayType}`);
                }
                if (arrayTypeValidation.formatted != null) {
                    value = entity[key] = arrayTypeValidation.formatted;
                }
                if (param.values && RequestValidator.checkValues(value, param.values) !== true) {
                    error.messages.push(`Invalid value, expecting one of [${param.values.join(',')}]`);
                }
                if (param.regex && !param.regex.test(value)) {
                    error.messages.push(`Value must match regex ${param.regex}`);
                }
                if (param.format) {
                    entity[key] = param.format(entity[key]);
                }
            }
            if (error.messages.length > 0) {
                errors.push(error);
            }
        }
        return errors;
    }
    static checkType(input) {
        if (input.type === 'numeric') {
            const isNumeric = !(input.value.length === 0) && !isNaN(input.value);
            if (isNumeric === true) {
                input.formatted = +input.value;
            }
            return isNumeric;
        }
        else if (input.type === 'number') {
            const isNumeric = !isNaN(input.value);
            if (isNumeric === true) {
                input.formatted = +input.value;
            }
            return isNumeric;
        }
        else if (input.type === 'boolean') {
            const isBoolean = ['0', '1', 'false', 'true', false, true, 0, 1].indexOf(input.value) >= 0;
            if (isBoolean === true) {
                input.formatted = ['1', 'true', true, 1].indexOf(input.value) >= 0;
            }
            return isBoolean;
        }
        else if (input.type === 'date') {
            if (input.value instanceof Date) {
                return true;
            }
            const milliseconds = Date.parse(input.value);
            if (isNaN(milliseconds)) {
                return false;
            }
            input.formatted = new Date();
            input.formatted.setTime(milliseconds);
            return true;
        }
        else if (input.type === 'array') {
            return Array.isArray(input.value);
        }
        return typeof input.value === input.type;
    }
    static checkMin(input, min) {
        if (Array.isArray(input)) {
            return input.length >= min;
        }
        switch (typeof input) {
            case 'number':
                return input >= min;
            case 'string':
                return input.length >= min;
            default:
                return false;
        }
    }
    static checkMax(input, max) {
        if (Array.isArray(input)) {
            return input.length <= max;
        }
        switch (typeof input) {
            case 'number':
                return input <= max;
            case 'string':
                return input.length <= max;
            default:
                return false;
        }
    }
    static checkLength(input, length) {
        if (Array.isArray(input)) {
            return input.length === length;
        }
        switch (typeof input) {
            case 'number':
                return input === length;
            case 'string':
                return input.length === length;
            default:
                return false;
        }
    }
    static checkArrayType(input) {
        if (input.value.length === 0) {
            return true;
        }
        for (const item of input.value) {
            const valid = (input.type === 'numeric') ? !isNaN(item) : typeof item === input.type;
            if (valid !== true) {
                return false;
            }
        }
        if (input.type === 'numeric' || input.type === 'number') {
            input.formatted = input.value.map(i => +i);
        }
        return true;
    }
    static checkValues(input, values) {
        if (Array.isArray(input)) {
            for (const item of input) {
                if (values.indexOf(item) < 0) {
                    return false;
                }
            }
            return true;
        }
        return values.indexOf(input) >= 0;
    }
}
exports.RequestValidator = RequestValidator;
//# sourceMappingURL=RequestValidator.js.map
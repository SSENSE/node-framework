"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorCodes = {
    '400': 'BadRequest',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'NotFound',
    '405': 'MethodNotAllowed',
    '409': 'Conflict',
    '429': 'TooManyRequests'
};
class Base extends Error {
    get statusCode() {
        return this._statusCode || 500;
    }
    get code() {
        if (!this._code) {
            this._code = errorCodes[this.statusCode] || 'InternalError';
        }
        return this._code;
    }
    get body() {
        if (!this._body) {
            this._body = Object.assign({
                code: this.code,
                message: this.message
            }, this.details ? { details: this.details } : null);
        }
        return this._body;
    }
    constructor(message, code, details) {
        super(message);
        this._code = code;
        this.details = details;
    }
    static fromHttpCode(httpCode, message, code, details) {
        const exception = new Base(message, code, details);
        if (typeof httpCode === 'number') {
            exception._statusCode = httpCode;
        }
        return exception;
    }
}
exports.Base = Base;
//# sourceMappingURL=Base.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Base extends Error {
    static getInternalExceptions() {
        if (!Base.internalExceptions) {
            const internalExceptions = require('./Exceptions');
            Base.internalExceptions = Object.keys(internalExceptions).reduce((acc, e) => {
                const entity = internalExceptions[e];
                acc[new entity().statusCode] = {
                    code: e.slice(0, -9),
                    entity
                };
                return acc;
            }, {});
        }
        return Base.internalExceptions;
    }
    get statusCode() {
        return this._statusCode || 500;
    }
    get code() {
        if (!this._code) {
            const internalExceptions = Base.getInternalExceptions();
            this._code = internalExceptions[this.statusCode] ? internalExceptions[this.statusCode].code : 'InternalError';
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
        const internalExceptions = Base.getInternalExceptions();
        if (internalExceptions.hasOwnProperty(httpCode)) {
            return new internalExceptions[httpCode].entity(message, code, details);
        }
        const exception = new Base(message, code, details);
        if (typeof httpCode === 'number') {
            exception._statusCode = httpCode;
        }
        return exception;
    }
    toJSON() {
        return this.body;
    }
}
exports.Base = Base;
//# sourceMappingURL=Base.js.map
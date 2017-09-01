"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Base extends Error {
    constructor(message, code = 'InternalError', details) {
        super(message);
        this.statusCode = 500;
        this.code = code;
        this.details = details;
    }
    get body() {
        return Object.assign({
            code: this.code,
            message: this.message
        }, this.details ? { details: this.details } : null);
    }
}
exports.Base = Base;
//# sourceMappingURL=Base.js.map
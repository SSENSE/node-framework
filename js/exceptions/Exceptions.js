"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Base_1 = require("./Base");
class BadRequestException extends Base_1.Base {
    constructor(message, code = 'BadRequest', details) {
        super(message, code, details);
        this.statusCode = 400;
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends Base_1.Base {
    constructor(message, code = 'Unauthorized', details) {
        super(message, code, details);
        this.statusCode = 401;
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends Base_1.Base {
    constructor(message, code = 'Forbidden', details) {
        super(message, code, details);
        this.statusCode = 403;
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends Base_1.Base {
    constructor(message, code = 'NotFound', details) {
        super(message, code, details);
        this.statusCode = 404;
    }
}
exports.NotFoundException = NotFoundException;
class MethodNotAllowedException extends Base_1.Base {
    constructor(message, code = 'MethodNotAllowed', details) {
        super(message, code, details);
        this.statusCode = 405;
    }
}
exports.MethodNotAllowedException = MethodNotAllowedException;
class ConflictException extends Base_1.Base {
    constructor(message, code = 'Conflict', details) {
        super(message, code, details);
        this.statusCode = 409;
    }
}
exports.ConflictException = ConflictException;
class TooManyRequestsException extends Base_1.Base {
    constructor(message, code = 'TooManyRequests', details) {
        super(message, code, details);
        this.statusCode = 429;
    }
}
exports.TooManyRequestsException = TooManyRequestsException;
//# sourceMappingURL=Exceptions.js.map
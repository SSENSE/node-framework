"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Base_1 = require("./Base");
class BadRequestException extends Base_1.Base {
    get statusCode() { return 400; }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends Base_1.Base {
    get statusCode() { return 401; }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends Base_1.Base {
    get statusCode() { return 403; }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends Base_1.Base {
    get statusCode() { return 404; }
}
exports.NotFoundException = NotFoundException;
class MethodNotAllowedException extends Base_1.Base {
    get statusCode() { return 405; }
}
exports.MethodNotAllowedException = MethodNotAllowedException;
class ConflictException extends Base_1.Base {
    get statusCode() { return 409; }
}
exports.ConflictException = ConflictException;
class TooManyRequestsException extends Base_1.Base {
    get statusCode() { return 429; }
}
exports.TooManyRequestsException = TooManyRequestsException;
//# sourceMappingURL=Exceptions.js.map
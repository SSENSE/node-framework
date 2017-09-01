import { Base } from './Base';

// 4XX errors
export class BadRequestException extends Base {
    public readonly statusCode: number = 400;
    constructor(message: string, code: string = 'BadRequest', details?: any) {
        super(message, code, details);
    }
}

export class UnauthorizedException extends Base {
    public readonly statusCode: number = 401;
    constructor(message: string, code: string = 'Unauthorized', details?: any) {
        super(message, code, details);
    }
}

export class ForbiddenException extends Base {
    public readonly statusCode: number = 403;
    constructor(message: string, code: string = 'Forbidden', details?: any) {
        super(message, code, details);
    }
}

export class NotFoundException extends Base {
    public readonly statusCode: number = 404;
    constructor(message: string, code: string = 'NotFound', details?: any) {
        super(message, code, details);
    }
}

export class MethodNotAllowedException extends Base {
    public readonly statusCode: number = 405;
    constructor(message: string, code: string = 'MethodNotAllowed', details?: any) {
        super(message, code, details);
    }
}

export class ConflictException extends Base {
    public readonly statusCode: number = 409;
    constructor(message: string, code: string = 'Conflict', details?: any) {
        super(message, code, details);
    }
}

export class TooManyRequestsException extends Base {
    public readonly statusCode: number = 429;
    constructor(message: string, code: string = 'TooManyRequests', details?: any) {
        super(message, code, details);
    }
}

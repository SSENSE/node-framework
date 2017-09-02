import { Base } from './Base';

// 4XX errors
export class BadRequestException extends Base {
    public get statusCode(): number { return 400; }
}

export class UnauthorizedException extends Base {
    public get statusCode(): number { return 401; }
}

export class ForbiddenException extends Base {
    public get statusCode(): number { return 403; }
}

export class NotFoundException extends Base {
    public get statusCode(): number { return 404; }
}

export class MethodNotAllowedException extends Base {
    public get statusCode(): number { return 405; }
}

export class ConflictException extends Base {
    public get statusCode(): number { return 409; }
}

export class TooManyRequestsException extends Base {
    public get statusCode(): number { return 429; }
}

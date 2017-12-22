const errorCodes: {[code: string]: string} = {
    '400': 'BadRequest',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'NotFound',
    '405': 'MethodNotAllowed',
    '409': 'Conflict',
    '429': 'TooManyRequests'
};

export class Base extends Error {
    private _statusCode: number;
    private _code: string;
    private _body: {code: string, message: string, details?: any};
    public readonly details?: any;

    public get statusCode(): number {
        return this._statusCode || 500;
    }

    public get code(): string {
        if (!this._code) {
            this._code = errorCodes[this.statusCode] || 'InternalError';
        }
        return this._code;
    }

    public get body(): {code: string, message: string, details?: any} {
        if (!this._body) {
            this._body = Object.assign({
                code: this.code,
                message: this.message
            }, this.details ? {details: this.details} : null);
        }
        return this._body;
    }

    constructor(message: string, code?: string, details?: any) {
        super(message);
        this._code = code;
        this.details = details;
    }

    public static fromHttpCode(httpCode: number, message: string, code?: string, details?: any): Base {
        const exception = new Base(message, code, details);
        if (typeof httpCode === 'number') {
            exception._statusCode = httpCode;
        }

        return exception;
    }

    public toJSON(): {code: string, message: string, details?: any} {
        return this.body;
    }
}

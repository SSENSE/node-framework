export class Base extends Error {
    private _statusCode: number;
    private _code: string;
    private _body: {code: string, message: string, details?: any};
    private static internalExceptions: {[httpCode: number]: { code: string, entity: any }};
    public readonly details?: any;

    private static getInternalExceptions(): {[httpCode: number]: { code: string, entity: any }} {
        if (!Base.internalExceptions) {
            const internalExceptions = require('./Exceptions');
            Base.internalExceptions = Object.keys(internalExceptions).reduce(
                (acc: {[httpCode: number]: { code: string, entity: Function }}, e: string) => {
                    const entity = (<any> internalExceptions)[e];
                    acc[new entity().statusCode] = {
                        code: e.slice(0, -9),
                        entity
                    };

                    return acc;
                },
                {}
            );
        }

        return Base.internalExceptions;
    }

    public get statusCode(): number {
        return this._statusCode || 500;
    }

    public get code(): string {
        if (!this._code) {
            const internalExceptions = Base.getInternalExceptions();
            this._code = internalExceptions[this.statusCode] ? internalExceptions[this.statusCode].code : 'InternalError';
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
        // Try to get a typed Exception based on HTTP code
        const internalExceptions = Base.getInternalExceptions();
        if (internalExceptions.hasOwnProperty(httpCode)) {
            return new internalExceptions[httpCode].entity(message, code, details);
        }

        // Else return a base Exception
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

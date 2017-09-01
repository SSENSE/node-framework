export class Base extends Error {
    public readonly statusCode: number = 500;
    public readonly code: string;
    public readonly details?: any;

    public get body(): {code: string, message: string, details?: any} {
        return Object.assign({
            code: this.code,
            message: this.message
        }, this.details ? {details: this.details} : null);
    }

    constructor(message: string, code: string = 'InternalError', details?: any) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

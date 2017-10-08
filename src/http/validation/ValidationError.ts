export class ValidationError extends Error {
    public errors: FieldValidationError[];

    constructor(errors?: FieldValidationError[]) {
        super('Request contains validation errors');
        this.errors = errors || [];
    }
}

export class FieldValidationError {
    public readonly field: string;
    public readonly location: string;
    public readonly messages: string[] = [];

    constructor(field: string, location: string) {
        this.field = field;
        this.location = location;
    }
}

export interface RequestValidation {
    headers?: RequestValidationEntity;
    params?: RequestValidationEntity;
    query?: RequestValidationEntity;
    body?: RequestValidationEntity;
    [key: string]: RequestValidationEntity;
}

export interface RequestValidationEntity {
    [key: string]: RequestValidationParam;
}

export interface RequestValidationParam {
    type: RequestValidationParamType; // tslint:disable-line:no-reserved-keywords
    required?: boolean;
    requires?: string[];
    mutuallyExcludes?: string[];
    min?: number;
    max?: number;
    length?: number;
    arrayType?: RequestValidationParamArrayType;
    arraySeparator?: string;
    values?: any[];
    regex?: RegExp;
    format?: <T>(data: T) => T;
}

export type RequestValidationParamType = 'string'|'number'|'boolean'|'numeric'|'date'|'array'|'object';
export type RequestValidationParamArrayType = 'string'|'number'|'boolean'|'numeric';

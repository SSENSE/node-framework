export interface RequestValidatorConfig {
    allowUnknownFields?: RequestValidatorConfigFields|boolean;
}

export interface RequestValidatorConfigFields {
    headers?: boolean;
    params?: boolean;
    query?: boolean;
    body?: boolean;
    [key: string]: boolean;
}

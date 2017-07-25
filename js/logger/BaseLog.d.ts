export declare class BaseLog {
    private static standardEnv;
    readonly app: string;
    readonly env: string;
    readonly service: string;
    readonly date: string;
    [key: string]: any;
    constructor(appId: string);
    private getStandardEnv();
}

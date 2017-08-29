import * as moment from 'moment';

export class BaseLog {
    private static standardEnv: string;

    public readonly app: string;
    public readonly env: string;
    public readonly service: string;
    public readonly date: string;
    [key: string]: any;

    public constructor(appId: string) {
        this.app = appId;
        this.env = this.getStandardEnv();
        this.service = 'node';
        this.date = moment().format('DD/MMM/YYYY:HH:mm:ss.SSS ZZ');
    }

    private getStandardEnv(): string {
        if (!BaseLog.standardEnv) {
            const env = process.env.NODE_ENV ? (<string> process.env.NODE_ENV).toLowerCase().trim() : null;
            switch (env) {
                case 'development': BaseLog.standardEnv = 'dev'; break;
                case 'production': BaseLog.standardEnv = 'prod'; break;
                default: BaseLog.standardEnv = env; break;
            }
        }

        return BaseLog.standardEnv;
    }
}

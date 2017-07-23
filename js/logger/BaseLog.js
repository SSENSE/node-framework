"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
class BaseLog {
    constructor(appId) {
        this.app = appId;
        this.env = this.getStandardEnv();
        this.service = 'node';
        this.date = moment().format('DD/MMM/YYYY:HH:mm:ss ZZ');
    }
    getStandardEnv() {
        if (!BaseLog.standardEnv) {
            const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase().trim() : null;
            switch (env) {
                case 'development':
                    BaseLog.standardEnv = 'dev';
                    break;
                case 'production':
                    BaseLog.standardEnv = 'prod';
                    break;
                default:
                    BaseLog.standardEnv = env;
                    break;
            }
        }
        return BaseLog.standardEnv;
    }
}
exports.BaseLog = BaseLog;
//# sourceMappingURL=BaseLog.js.map
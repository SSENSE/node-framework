"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Common_1 = require("./Common");
const BaseLog_1 = require("./BaseLog");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Silly"] = 0] = "Silly";
    LogLevel[LogLevel["Verbose"] = 1] = "Verbose";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Warn"] = 3] = "Warn";
    LogLevel[LogLevel["Error"] = 4] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
const logLevelFunctions = Object.keys(LogLevel).map(k => LogLevel[k])
    .filter(v => typeof v === 'string')
    .map((k) => k.toLowerCase());
class AppLogger {
    constructor(appId, level = LogLevel.Info, stream = process.stderr) {
        this.enabled = true;
        this.pretty = false;
        this.appId = appId;
        this.level = level;
        this.stream = stream;
    }
    getLogLevel(level) {
        return typeof LogLevel[level] === 'string' ? LogLevel[level].toLowerCase() : 'log';
    }
    colorizeLevel(level) {
        let color = null;
        switch (level) {
            case LogLevel.Error:
                color = Common_1.Color.red;
                break;
            case LogLevel.Warn:
                color = Common_1.Color.yellow;
                break;
            case LogLevel.Info:
                color = Common_1.Color.green;
                break;
            case LogLevel.Verbose:
                color = Common_1.Color.blue;
                break;
            case LogLevel.Silly:
                color = Common_1.Color.cyan;
                break;
            default:
                color = 0;
                break;
        }
        return `\x1B[${color}m${this.getLogLevel(level)}\x1B[0m`;
    }
    enable(enabled) {
        this.enabled = enabled;
    }
    setAppId(appId) {
        this.appId = appId;
    }
    getAppId() {
        return this.appId;
    }
    generateRequestId() {
        return Common_1.generateRequestId();
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
    setPretty(pretty) {
        this.pretty = pretty;
    }
    setStream(stream) {
        this.stream = stream;
        this.enable(true);
    }
    log(level, message, id, tags, details) {
        if (this.enabled !== true || this.level === undefined || level < this.level) {
            return;
        }
        const log = new BaseLog_1.BaseLog(this.appId);
        log.reqId = id || this.generateRequestId();
        log.level = this.getLogLevel(level);
        log.message = message;
        log.tags = tags || [];
        log.details = details || null;
        if (this.pretty) {
            let result = JSON.stringify(log, null, 4).replace(/"level": "([^"]*)"/g, `"level": "${this.colorizeLevel(level)}"`);
            if (typeof log.details === 'string') {
                result = result.replace(/"details": ".*"/g, `"details": "${log.details.replace(/\n/g, `\n${' '.repeat(12)}`)}"`);
            }
            this.stream.write(`${result}\n`);
        }
        else {
            this.stream.write(JSON.stringify(log) + '\n');
        }
    }
    silly(message, id, tags, details) {
        this.log(LogLevel.Silly, message, id, tags, details);
    }
    verbose(message, id, tags, details) {
        this.log(LogLevel.Verbose, message, id, tags, details);
    }
    info(message, id, tags, details) {
        this.log(LogLevel.Info, message, id, tags, details);
    }
    warn(message, id, tags, details) {
        this.log(LogLevel.Warn, message, id, tags, details);
    }
    error(message, id, tags, details) {
        this.log(LogLevel.Error, message, id, tags, details);
    }
    getRequestLogger(requestId) {
        const logger = {};
        for (const logFunction of logLevelFunctions) {
            logger[logFunction] = (message, tags, details) => {
                this[logFunction].call(this, message, requestId, tags, details);
            };
        }
        return logger;
    }
}
exports.AppLogger = AppLogger;
//# sourceMappingURL=AppLogger.js.map
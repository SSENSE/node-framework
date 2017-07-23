"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onHeaders = require("on-headers");
const onFinished = require("on-finished");
const Common_1 = require("./Common");
const BaseLog_1 = require("./BaseLog");
class AccessLogger {
    constructor(appId) {
        this.enabled = true;
        this.pretty = false;
        this.stream = process.stdout;
        this.appId = appId;
    }
    enable(enabled) {
        this.enabled = enabled;
    }
    setPretty(pretty) {
        this.pretty = pretty;
    }
    setStream(stream) {
        this.stream = stream;
        this.enable(true);
    }
    setAppId(appId) {
        this.appId = appId;
    }
    setUserIdCallback(callback) {
        this.userIdCallback = callback;
    }
    logRequest(req, res, next) {
        if (typeof next === 'function') {
            if (this.enabled === true) {
                const start = Date.now();
                let duration = 0;
                onHeaders(res, () => {
                    duration = Date.now() - start;
                });
                onFinished(res, () => {
                    this.log(req, res, duration);
                });
            }
            next();
        }
        else if (this.enabled === true) {
            this.log(req, res);
        }
    }
    log(req, res, duration) {
        let line = null;
        const latency = typeof duration === 'number' ? duration : (req._time ? Date.now() - req._time : undefined);
        if (this.pretty) {
            const color = res.statusCode >= 500 ? Common_1.Color.red : res.statusCode >= 400 ? Common_1.Color.yellow : res.statusCode >= 300 ? Common_1.Color.cyan : Common_1.Color.green;
            const resTime = latency ? `${latency} ms` : '-';
            const size = res.getHeader('content-length') || '-';
            line = `${req.method} ${req.url} \x1B[${color}m${res.statusCode}\x1B[0m ${resTime} - ${size}`;
        }
        else {
            const log = new BaseLog_1.BaseLog(this.appId);
            log.reqId = req.xRequestId || Common_1.generateRequestId();
            log.userId = this.getUserId(req, res);
            log.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
            log.method = req.method;
            log.route = req.url;
            log.httpVersion = `HTTP/${req.httpVersion}`;
            log.resCode = res.statusCode;
            log.resSize = +res.getHeader('content-length');
            log.resTime = latency;
            log.referer = req.header('referer');
            log.userAgent = req.header('user-agent');
            line = JSON.stringify(log);
        }
        this.stream.write(`${line}\n`);
    }
    getUserId(req, res) {
        let userId = null;
        if (typeof this.userIdCallback === 'function') {
            try {
                userId = this.userIdCallback(req, res);
            }
            catch (e) { }
        }
        return userId;
    }
}
exports.AccessLogger = AccessLogger;
//# sourceMappingURL=AccessLogger.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class Pool {
    constructor(generator, max) {
        this.started = false;
        this.runningPromises = 0;
        this.finished = false;
        this.index = 0;
        if (typeof generator !== 'function') {
            throw new Error('generator must be a function');
        }
        else if (typeof max !== 'number' || max <= 0) {
            throw new Error('max must be a number greater than 0');
        }
        this.generator = generator;
        this.max = max;
        this.emitter = new events_1.EventEmitter();
        this.emitter.on('resolved', (data, index) => {
            this.runningPromises -= 1;
            this.stats.resolved += 1;
            this.SpawnNewPromise();
        });
        this.emitter.on('rejected', (err, index) => {
            this.runningPromises -= 1;
            this.stats.rejected += 1;
            this.SpawnNewPromise();
        });
    }
    onResolved(callback) {
        this.emitter.on('resolved', callback);
        return this;
    }
    onRejected(callback) {
        this.emitter.on('rejected', callback);
        return this;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.started) {
                throw new Error('Pool is already running');
            }
            this.started = true;
            this.finished = false;
            this.runningPromises = 0;
            this.index = 0;
            this.stats = { resolved: 0, rejected: 0, duration: 0 };
            const startDate = Date.now();
            return new Promise((resolve, reject) => {
                try {
                    for (let i = 0; !this.finished && i < this.max; i += 1) {
                        this.SpawnNewPromise();
                    }
                    this.emitter.once('finished', () => {
                        this.started = false;
                        this.stats.duration = Date.now() - startDate;
                        return resolve(this.stats);
                    });
                }
                catch (e) {
                    this.started = false;
                    this.finished = true;
                    return reject(e);
                }
            });
        });
    }
    SpawnNewPromise() {
        if (!this.finished) {
            const promise = this.generator();
            if (promise === null) {
                this.finished = true;
            }
            else {
                this.handlePromise(promise);
            }
        }
        if (this.finished && this.runningPromises === 0) {
            this.emitter.emit('finished');
        }
    }
    handlePromise(promise) {
        return __awaiter(this, void 0, void 0, function* () {
            this.runningPromises += 1;
            const index = this.index;
            this.index += 1;
            try {
                const result = yield Promise.resolve(promise);
                this.emitter.emit('resolved', result, index);
            }
            catch (e) {
                this.emitter.emit('rejected', e, index);
            }
        });
    }
}
exports.Pool = Pool;
//# sourceMappingURL=Pool.js.map
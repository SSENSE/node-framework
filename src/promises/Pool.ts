import { EventEmitter } from 'events';

export interface PromiseGenerator {
    (): Promise<any>;
}

export interface PoolStats {
    resolved: number;
    rejected: number;
    duration: number;
}

export class Pool {
    private emitter: EventEmitter;
    private generator: PromiseGenerator;
    private max: number;

    private started: boolean = false;
    private runningPromises: number = 0;
    private finished: boolean = false;
    private index: number = 0;
    private stats: PoolStats;

    constructor(generator: PromiseGenerator, max: number) {
        if (typeof generator !== 'function') {
            throw new Error('generator must be a function');
        } else if (typeof max !== 'number' || max <= 0) {
            throw new Error('max must be a number greater than 0');
        }

        this.generator = generator;
        this.max = max;

        this.emitter = new EventEmitter();

        this.emitter.on('resolved', (data: any, index: number) => {
            this.runningPromises -= 1;
            this.stats.resolved += 1;
            this.SpawnNewPromise();
        });

        this.emitter.on('rejected', (err: any, index: number) => {
            this.runningPromises -= 1;
            this.stats.rejected += 1;
            this.SpawnNewPromise();
        });
    }

    public onResolved(callback: (data: any, index: number) => void): Pool {
        this.emitter.on('resolved', callback);
        return this;
    }

    public onRejected(callback: (err: Error, index: number) => void): Pool {
        this.emitter.on('rejected', callback);
        return this;
    }

    public async run(): Promise<PoolStats> {
        if (this.started) {
            throw new Error('Pool is already running');
        }

        this.started = true;
        this.finished = false;
        this.runningPromises = 0;
        this.index = 0;
        this.stats = { resolved: 0, rejected: 0, duration: 0 };
        const startDate = Date.now();

        return new Promise<PoolStats>((resolve, reject) => {
            try {
                for (let i = 0; !this.finished && i < this.max; i += 1) {
                    this.SpawnNewPromise();
                }

                this.emitter.once('finished', () => {
                    this.started = false;
                    this.stats.duration = Date.now() - startDate;
                    return resolve(this.stats);
                });
            } catch (e) {
                this.started = false;
                this.finished = true;
                return reject(e);
            }
        });
    }

    private SpawnNewPromise(): void {
        if (!this.finished) {
            const promise = this.generator();
            if (promise === null) {
                this.finished = true;
            } else {
                this.handlePromise(promise);
            }
        }

        if (this.finished && this.runningPromises === 0) {
            this.emitter.emit('finished');
        }
    }

    private async handlePromise(promise: Promise<any>): Promise<void> {
        this.runningPromises += 1;
        const index = this.index;
        this.index += 1;

        try {
            const result = await Promise.resolve(promise);
            this.emitter.emit('resolved', result, index);
        } catch (e) {
            this.emitter.emit('rejected', e, index);
        }
    }
}

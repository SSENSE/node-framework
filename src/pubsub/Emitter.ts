import * as request from 'request';

export interface EmitterOptions {
    host: string;
    accessToken: string;
    userAgent: string;
    port?: number;
    secure?: boolean;
    timeout?: number;
    debug?: boolean;
}

export class Emitter {
    private baseUrl: string;
    protected host: string;
    protected accessToken: string;
    protected userAgent: string;
    protected port: number;
    protected secure: boolean;
    protected timeout: number;
    protected debug: boolean;

    constructor(options: EmitterOptions) {
        if (!options || !options.host || typeof options.host !== 'string' || options.host.trim().split('/').join('') === '') {
            throw new Error('options.host is required');
        } else if (!options.accessToken || typeof options.accessToken !== 'string' || options.accessToken.trim() === '') {
            throw new Error('options.accessToken is required');
        } else if (!options.userAgent || typeof options.userAgent !== 'string' || options.userAgent.trim() === '') {
            throw new Error('options.userAgent is required');
        }

        this.host = options.host.trim().replace(/\/+$/g, '');
        this.accessToken = options.accessToken.trim();
        this.userAgent = options.userAgent;
        this.port = options.port && !isNaN(options.port) ? +options.port : 80;
        this.secure = options.secure === true || this.port === 443;
        this.timeout = options.timeout && !isNaN(options.timeout) ? +options.timeout : 5000;
        this.debug = typeof options.debug === 'boolean' ? options.debug : false;

        const port = ((!this.secure && this.port === 80) || (this.secure && this.port === 443)) ? '' : `:${this.port}`;
        this.baseUrl = `${this.secure ? 'https' : 'http'}://${this.host}${port}`;
    }

    public emit(topic: string, data: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const requestParams: any = {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${this.accessToken}`,
                    'Content-Type': 'multipart/form-data',
                    'User-Agent': this.userAgent
                },
                formData: {
                    'topic_name': topic,
                    'version': 1,
                    'content': JSON.stringify(data),
                    'debug': this.debug ? '1' : '0'
                },
                timeout: this.timeout
            };

            request(`${this.baseUrl}/api/messages`, requestParams, (err, res, body) => {
                if (err) { // Technical error
                    return reject(err);
                } else if (res.statusCode > 399) {
                    return reject(new Error(`An error occurred while sending pubsub message: ${body}`));
                }

                let responseBody: any = null;
                try {
                    responseBody = JSON.parse(body);
                } catch (e) {
                    return reject(new Error(`Invalid response body received: ${body}`));
                }

                if (responseBody.status !== 'success') {
                    return reject(new Error(responseBody.data));
                } else {
                    return resolve(responseBody.data.msg_guid);
                }
            });
        });
    }
}

import * as request from 'request';

interface SlackMessage {
    channel: string;
    text: string;
    username: string;
    icon_emoji: string;
    attachments?: SlackMessageAttachement[];
}

interface SlackMessageAttachement {
    title: string;
    text: string;
}

export class SlackNotifier {
    private readonly slackBaseUrl: string = 'https://hooks.slack.com';
    private webHookUrl: string;
    private defaultDestination: string;
    private userName: string;
    private icon: string;

    constructor(webHookUrl: string, defaultDestination: string, userName: string, icon?: string) {
        if (typeof webHookUrl !== 'string' || !webHookUrl.startsWith(this.slackBaseUrl)) {
            throw new Error(`webHookUrl must be a valid string starting with "${this.slackBaseUrl}"`);
        } else if (typeof defaultDestination !== 'string' || ['#', '@'].indexOf(defaultDestination[0]) < 0) {
            throw new Error('defaultDestination must be a valid string starting with "#" or "@"');
        } else if (typeof userName !== 'string' || userName.trim() === '') {
            throw new Error('userName is required');
        }

        this.webHookUrl = webHookUrl.trim();
        this.defaultDestination = defaultDestination.trim();
        this.userName = userName.trim();
        this.icon = icon || ':ghost:';
    }

    public send(message: string, detail: string = null, destination: string = null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (typeof destination === 'string' && ['#', '@'].indexOf(destination[0]) < 0) {
                return reject(new Error('destination must be a valid string starting with "#" or "@"'));
            }

            const slackMessage: SlackMessage = {
                channel: typeof destination === 'string' ? destination : this.defaultDestination,
                text: message,
                username: this.userName,
                icon_emoji: this.icon
            };
            if (detail) {
                slackMessage.attachments = [{
                    title: 'Detail',
                    text: detail
                }];
            }

            request({
                url: this.webHookUrl,
                method: 'POST',
                json: true,
                body: slackMessage
            }, (err, res, body) => {
                if (err) {
                    return reject(err);
                } else if (res.statusCode > 399) {
                    return reject(new Error(`An error occurred while sending slack notification: ${body}`));
                }
                return resolve();
            });
        });
    }
}

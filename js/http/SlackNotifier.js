"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
class SlackNotifier {
    constructor(webHookUrl, defaultChannel, userName, icon) {
        this.slackBaseUrl = 'https://hooks.slack.com';
        if (typeof webHookUrl !== 'string' || !webHookUrl.startsWith(this.slackBaseUrl)) {
            throw new Error(`webHookUrl must be a valid string starting with "${this.slackBaseUrl}"`);
        }
        else if (typeof defaultChannel !== 'string' || !defaultChannel.startsWith('#')) {
            throw new Error('defaultChannel must be a valid string starting with "#"');
        }
        else if (typeof userName !== 'string' || userName.trim() === '') {
            throw new Error('userName is required');
        }
        this.webHookUrl = webHookUrl.trim();
        this.defaultChannel = defaultChannel.trim();
        this.userName = userName.trim();
        this.icon = icon || ':ghost:';
    }
    send(message, detail = null, channel = null) {
        return new Promise((resolve, reject) => {
            const slackMessage = {
                channel: channel ? channel : this.defaultChannel,
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
                }
                else if (res.statusCode > 399) {
                    return reject(new Error(`An error occurred while sending slack notification: ${body}`));
                }
                return resolve();
            });
        });
    }
}
exports.SlackNotifier = SlackNotifier;
//# sourceMappingURL=SlackNotifier.js.map
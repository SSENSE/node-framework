import * as crypto from 'crypto';
import { Helper } from '../Helper';
import { Provider as BaseProvider } from '../Provider';
import { Message } from './Message';

interface AmazonMessage {
    Message: string;
    MessageId: string;
    Subject?: string;
    Signature: string;
    SignatureVersion: string;
    SigningCertURL: string;
    SubscribeURL?: string;
    Timestamp: string;
    Token?: string;
    TopicArn: string;
    Type: string;
    UnsubscribeURL?: string;
}

enum AmazonMessageType {
    SubscriptionConfirmation  = 'SubscriptionConfirmation',
    Notification = 'Notification',
    UnsubscribeConfirmation = 'UnsubscribeConfirmation'
}

export class Provider implements BaseProvider {
    private readonly providerName: string = 'amazon-sns';
    private readonly requiredFields: string [] = [
        'Message', 'MessageId', 'Signature', 'SignatureVersion', 'SigningCertURL', 'Timestamp', 'TopicArn', 'Type'
    ];

    private readonly amazonUrlRegex: RegExp = /^https:\/\/sns\.[^\/]+\.amazonaws\.com\/.*\.pem$/;

    private certs: {[url: string]: string} = {};
    private messageParseFunction: (message: string) => string;

    public setMessageParseFunction(func: (message: string) => string): void {
        this.messageParseFunction = func;
    }

    public canHandle(message: any): boolean {
        if (message && typeof message === 'object') {
            for (const field of this.requiredFields) {
                if (!message.hasOwnProperty(field) || !message[field]) {
                    return false;
                }
            }

            return true;
        }
        return false;
    }

    public async parse(message: AmazonMessage): Promise<Message> {
        // First check that message is valid
        await this.validateSignature(message);

        const result = new Message();
        result.provider = this.providerName;
        result.id = message.MessageId;
        result.topic = message.TopicArn.split(':').pop();
        result.date = new Date(message.Timestamp);
        result.data = typeof this.messageParseFunction === 'function' ? this.messageParseFunction(message.Message) : message.Message;
        result.isSubscription = message.Type === AmazonMessageType.SubscriptionConfirmation;
        result.isUnsubscription = message.Type === AmazonMessageType.UnsubscribeConfirmation;

        if (message.SubscribeURL) {
            result.setSubscribeUrl(message.SubscribeURL);
        }

        if (message.UnsubscribeURL) {
            result.setUnsubscribeUrl(message.UnsubscribeURL);
        }

        return result;
    }

    private async validateSignature(message: AmazonMessage): Promise<void> {
        // Check signature version
        if (message.SignatureVersion !== '1') {
            throw new Error(`Signature version "${message.SignatureVersion}" is not supported`);
        }

        // Check that certificate url belongs to amazon
        if (this.amazonUrlRegex.test(message.SigningCertURL) !== true) {
            throw new Error('Certificate url does not belong to Amazon, message could have been altered');
        }

        // Get signature payload fields
        let payloadFields: string[];
        switch (message.Type) {
            case AmazonMessageType.SubscriptionConfirmation:
            case AmazonMessageType.UnsubscribeConfirmation:
                payloadFields = ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
                break;
            case AmazonMessageType.Notification:
                if (message.Subject) {
                    payloadFields = ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'];
                } else {
                    payloadFields = ['Message', 'MessageId', 'Timestamp', 'TopicArn', 'Type'];
                }
                break;
            default: throw new Error(`Message with type "${message.Type}" is not supported`);
        }

        // Get certificate
        if (!this.certs.hasOwnProperty(message.SigningCertURL)) {
            const remoteCert = await Helper.getUrl(message.SigningCertURL);
            if (typeof remoteCert === 'string') {
                this.certs[message.SigningCertURL] = remoteCert;
            } else {
                throw new Error('Invalid remote certificate retrieved from Amazon');
            }
        }
        const cert = this.certs[message.SigningCertURL];

        // Validate certificate
        const payload: string = payloadFields.map(f => `${f}\n${(<any> message)[f]}\n`).join('');
        const signingFunction = crypto.createVerify('sha1');
        signingFunction.update(payload);
        if (signingFunction.verify(cert, Buffer.from(message.Signature, 'base64')) !== true) {
            throw new Error('Invalid message signature, message could have been altered');
        }
    }
}

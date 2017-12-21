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
const crypto = require("crypto");
const Helper_1 = require("../Helper");
const Message_1 = require("./Message");
var AmazonMessageType;
(function (AmazonMessageType) {
    AmazonMessageType["SubscriptionConfirmation"] = "SubscriptionConfirmation";
    AmazonMessageType["Notification"] = "Notification";
    AmazonMessageType["UnsubscribeConfirmation"] = "UnsubscribeConfirmation";
})(AmazonMessageType || (AmazonMessageType = {}));
class Provider {
    constructor(isDevMode = false) {
        this.isDevMode = isDevMode;
        this.providerName = 'amazon-sns';
        this.requiredFields = [
            'Message', 'MessageId', 'Signature', 'SignatureVersion', 'SigningCertURL', 'Timestamp', 'TopicArn', 'Type'
        ];
        this.amazonUrlRegex = /^https:\/\/sns\.[^\/]+\.amazonaws\.com\/.*\.pem$/;
        this.certs = {};
    }
    setMessageParseFunction(func) {
        this.messageParseFunction = func;
    }
    canHandle(message) {
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
    parse(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isDevMode) {
                yield this.validateSignature(message);
            }
            const result = new Message_1.Message();
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
        });
    }
    validateSignature(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.SignatureVersion !== '1') {
                throw new Error(`Signature version "${message.SignatureVersion}" is not supported`);
            }
            if (this.amazonUrlRegex.test(message.SigningCertURL) !== true) {
                throw new Error('Certificate url does not belong to Amazon, message could have been altered');
            }
            let payloadFields;
            switch (message.Type) {
                case AmazonMessageType.SubscriptionConfirmation:
                case AmazonMessageType.UnsubscribeConfirmation:
                    payloadFields = ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
                    break;
                case AmazonMessageType.Notification:
                    if (message.Subject) {
                        payloadFields = ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'];
                    }
                    else {
                        payloadFields = ['Message', 'MessageId', 'Timestamp', 'TopicArn', 'Type'];
                    }
                    break;
                default: throw new Error(`Message with type "${message.Type}" is not supported`);
            }
            if (!this.certs.hasOwnProperty(message.SigningCertURL)) {
                const remoteCert = yield Helper_1.Helper.getUrl(message.SigningCertURL);
                if (typeof remoteCert === 'string') {
                    this.certs[message.SigningCertURL] = remoteCert;
                }
                else {
                    throw new Error('Invalid remote certificate retrieved from Amazon');
                }
            }
            const cert = this.certs[message.SigningCertURL];
            const payload = payloadFields.map(f => `${f}\n${message[f]}\n`).join('');
            const signingFunction = crypto.createVerify('sha1');
            signingFunction.update(payload);
            if (signingFunction.verify(cert, Buffer.from(message.Signature, 'base64')) !== true) {
                throw new Error('Invalid message signature, message could have been altered');
            }
        });
    }
}
exports.Provider = Provider;
//# sourceMappingURL=Provider.js.map
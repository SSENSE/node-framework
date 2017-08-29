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
const Helper_1 = require("../Helper");
const Message_1 = require("../Message");
class Message extends Message_1.Message {
    setSubscribeUrl(url) {
        this.subscribeUrl = url;
    }
    setUnsubscribeUrl(url) {
        this.unsubscribeUrl = url;
    }
    subscribeToTopic() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.subscribeUrl) {
                yield Helper_1.Helper.getUrl(this.subscribeUrl);
            }
        });
    }
    unsubscribeFromTopic() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.unsubscribeUrl) {
                yield Helper_1.Helper.getUrl(this.unsubscribeUrl);
            }
        });
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.js.map
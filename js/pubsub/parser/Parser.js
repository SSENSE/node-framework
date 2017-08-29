"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Provider_1 = require("./amazon/Provider");
class Parser {
    constructor() {
        this.providers = [
            new Provider_1.Provider()
        ];
    }
    setMessageParseFunction(func) {
        this.providers.forEach(p => {
            p.setMessageParseFunction(func);
        });
    }
    parse(message) {
        for (const provider of this.providers) {
            if (provider.canHandle(message)) {
                return provider.parse(message);
            }
        }
        throw new Error('Message not supported');
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map
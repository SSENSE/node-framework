"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
class Helper {
    static getUrl(url) {
        return new Promise((resolve, reject) => {
            request.get(url, (err, response) => {
                if (err) {
                    return reject(err);
                }
                else if (response.statusCode >= 400) {
                    return reject(new Error(`Received status code ${response.statusCode} when trying to get ${url}`));
                }
                return resolve(response.body);
            });
        });
    }
}
exports.Helper = Helper;
//# sourceMappingURL=Helper.js.map
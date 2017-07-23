"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
var Color;
(function (Color) {
    Color[Color["red"] = 31] = "red";
    Color[Color["green"] = 32] = "green";
    Color[Color["yellow"] = 33] = "yellow";
    Color[Color["blue"] = 34] = "blue";
    Color[Color["cyan"] = 36] = "cyan";
})(Color = exports.Color || (exports.Color = {}));
function generateRequestId() {
    return uuid.v4();
}
exports.generateRequestId = generateRequestId;
//# sourceMappingURL=Common.js.map
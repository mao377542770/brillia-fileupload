"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tools = void 0;
var tslib_1 = require("tslib");
var Tools = (function () {
    function Tools() {
    }
    Tools.strToDate = function (dateStr) {
        if (!dateStr) {
            return undefined;
        }
        if (dateStr instanceof Date) {
            return dateStr;
        }
        var exportDate = new Date(dateStr.replace(/-/g, "/"));
        var isInvalidDate = function (date) { return Number.isNaN(date.getTime()); };
        if (isInvalidDate(exportDate)) {
            throw new Error(dateStr + "が有効な日付ではあまりせん");
        }
        return exportDate;
    };
    Tools.chunk = function (inputArray, chunkSize) {
        var arr = [];
        var len = inputArray.length;
        for (var i = 0; i < len; i += chunkSize) {
            arr.push(tslib_1.__spreadArray([], tslib_1.__read(inputArray.slice(i, i + chunkSize))));
        }
        return arr;
    };
    return Tools;
}());
exports.Tools = Tools;
//# sourceMappingURL=tools.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var dotenv_1 = tslib_1.__importDefault(require("dotenv"));
var files_controller_1 = require("./controller/files.controller");
var readline_1 = tslib_1.__importDefault(require("readline"));
dotenv_1.default.config();
var App = (function () {
    function App() {
        this.init();
    }
    App.prototype.init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var fileCtl, rl;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                fileCtl = new files_controller_1.FilesController();
                console.log("\n    \u79FB\u884C\u5BFE\u8C61\u3092\u3054\u9078\u629E\u304F\u3060\u3055\u3044:\n      1.\u5171\u7528\u90E8\u4F4F\u6238\u30AB\u30EB\u30C6\n      2.\u30B3\u30F3\u30BF\u30AF\u30C8\u60C5\u5831\n    ");
                rl = readline_1.default.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.on("line", function (str) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(str === "1")) return [3, 2];
                                console.log("===共用部住戸カルテ移行開始===");
                                return [4, fileCtl.initCommonKarteInfo()];
                            case 1:
                                _a.sent();
                                return [3, 6];
                            case 2:
                                if (!(str == "2")) return [3, 4];
                                console.log("===コンタクト情報移行開始===");
                                return [4, fileCtl.initContact()];
                            case 3:
                                _a.sent();
                                return [3, 6];
                            case 4: return [4, fileCtl.createTestFile2()];
                            case 5:
                                _a.sent();
                                _a.label = 6;
                            case 6:
                                rl.close();
                                return [2];
                        }
                    });
                }); });
                rl.on("close", function () {
                    console.log("===**移行終了**===");
                });
                return [2];
            });
        });
    };
    return App;
}());
exports.default = App;
new App();
//# sourceMappingURL=app.js.map
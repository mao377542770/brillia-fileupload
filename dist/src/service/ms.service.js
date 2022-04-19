"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsSql = void 0;
var tslib_1 = require("tslib");
var tedious_1 = require("tedious");
var MsSql = (function () {
    function MsSql() {
        this.isConnectFlag = false;
        this.config = {
            server: process.env.MSSSQL_HOST,
            authentication: {
                type: "default",
                options: {
                    userName: process.env.MSSSQL_USER,
                    password: process.env.MSSSQL_PASSWORD
                }
            },
            options: {
                port: 1433,
                encrypt: true,
                database: process.env.MSSSQL_DATABASE,
                trustServerCertificate: true,
                rowCollectionOnRequestCompletion: true
            }
        };
        this.connection = new tedious_1.Connection(this.config);
    }
    MsSql.prototype.connect = function () {
        var _this = this;
        this.connection.connect();
        return new Promise(function (resolve, reject) {
            _this.connection.on("connect", function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    _this.isConnectFlag = true;
                    resolve("DB接続成功");
                }
            });
        });
    };
    Object.defineProperty(MsSql.prototype, "isConnect", {
        get: function () {
            return this.isConnectFlag;
        },
        enumerable: false,
        configurable: true
    });
    MsSql.prototype.disConnect = function () {
        this.connection.close();
        this.isConnectFlag = false;
    };
    MsSql.prototype.query = function (sql) {
        var _this = this;
        if (!this.isConnect) {
            this.connection.connect();
        }
        return new Promise(function (resolve, reject) {
            var request = new tedious_1.Request(sql, function (err, rowCount, rows) {
                var e_1, _a, e_2, _b;
                console.info("[SQL]:" + sql);
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.info("[\u53D6\u5F97\u4EF6\u6570]:" + rowCount);
                var records = [];
                try {
                    for (var rows_1 = tslib_1.__values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
                        var row = rows_1_1.value;
                        var obj = {};
                        try {
                            for (var row_1 = (e_2 = void 0, tslib_1.__values(row)), row_1_1 = row_1.next(); !row_1_1.done; row_1_1 = row_1.next()) {
                                var col = row_1_1.value;
                                if (col.value) {
                                    obj[col.metadata.colName] = col.value;
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (row_1_1 && !row_1_1.done && (_b = row_1.return)) _b.call(row_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        records.push(obj);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) _a.call(rows_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                resolve(records);
            });
            _this.connection.execSql(request);
        });
    };
    return MsSql;
}());
exports.MsSql = MsSql;
//# sourceMappingURL=ms.service.js.map
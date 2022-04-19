"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SfdcService = void 0;
var tslib_1 = require("tslib");
var jsforce_1 = require("jsforce");
var request_1 = tslib_1.__importDefault(require("request"));
var form_data_1 = tslib_1.__importDefault(require("form-data"));
var axios_1 = tslib_1.__importDefault(require("axios"));
var SfdcService = (function () {
    function SfdcService() {
        var _this = this;
        this.authConfig = {
            oauth2: {
                loginUrl: process.env.SFDC_DOMAIN,
                clientId: process.env.SFDC_CLIENTID,
                clientSecret: process.env.SFDC_CLIENTSECRET,
                redirectUri: process.env.SFDC_REDIRECTURI
            },
            instanceUrl: "https://tatemono--dev.my.salesforce.com",
            accessToken: "",
            refreshToken: ""
        };
        this.loginUser = {
            username: process.env.SFDC_USERNAME ? process.env.SFDC_USERNAME : "",
            password: process.env.SFDC_PASSWORD ? process.env.SFDC_PASSWORD : ""
        };
        if (!SfdcService.conn) {
            SfdcService.conn = new jsforce_1.Connection(this.authConfig);
            SfdcService.conn.on("refresh", function (newAccessToken, res) {
                console.log("Access token refreshed");
                SfdcService.accessToken = newAccessToken;
                _this.authConfig.accessToken = newAccessToken;
            });
        }
    }
    SfdcService.prototype.login = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!SfdcService.conn) return [3, 2];
                        return [4, SfdcService.conn.login(this.loginUser.username, this.loginUser.password, function (err, userinfo) {
                                if (err) {
                                    return console.error(err);
                                }
                                _this.userInfo = userinfo;
                                SfdcService.accessToken = SfdcService.conn.accessToken;
                                _this.authConfig.accessToken = SfdcService.accessToken;
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    SfdcService.prototype.getData = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var query, promise;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        query = "SELECT Id, Name ,Account.Name, ResponseKinds__c FROM Opportunity";
                        promise = new Promise(function (resolve) {
                            SfdcService.conn.query(query, undefined, function (_err, _result) {
                                console.log("total : " + _result.totalSize);
                                console.log("fetched : " + _result.records.length);
                                console.log(_result.records);
                                resolve(_result);
                            });
                        });
                        return [2, promise];
                }
            });
        });
    };
    SfdcService.prototype.query = function (query) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promise;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        console.log("[REST SOQL]:" + query);
                        promise = new Promise(function (resolve) {
                            SfdcService.conn.query(query, undefined, function (_err, _result) {
                                if (_err) {
                                    console.error(_err);
                                    throw _err;
                                }
                                console.log("total : " + _result.totalSize);
                                console.log("fetched : " + _result.records.length);
                                resolve(_result);
                            });
                        });
                        return [2, promise];
                }
            });
        });
    };
    SfdcService.prototype.bulkQuery = function (query, pollInterval, pollTimeout) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        console.log("[BULK SOQL]:" + query);
                        SfdcService.conn.bulk.pollInterval = pollInterval ? pollInterval : 2000;
                        SfdcService.conn.bulk.pollTimeout = pollTimeout ? pollTimeout : 600000;
                        return [2, SfdcService.conn.bulk.query(query)];
                }
            });
        });
    };
    SfdcService.prototype.sendChatter = function (message, mentionIds, url) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var messageSegments, mentionIds_1, mentionIds_1_1, mentionId, promise;
            var e_1, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        messageSegments = [{ type: "Text", text: message }];
                        if (url) {
                            messageSegments.push({
                                type: "LINK",
                                url: url
                            });
                        }
                        messageSegments.push({
                            type: "Text",
                            text: "\n      \u4F5C\u6210\u8005:\n      "
                        });
                        try {
                            for (mentionIds_1 = tslib_1.__values(mentionIds), mentionIds_1_1 = mentionIds_1.next(); !mentionIds_1_1.done; mentionIds_1_1 = mentionIds_1.next()) {
                                mentionId = mentionIds_1_1.value;
                                messageSegments.push({
                                    type: "Mention",
                                    id: mentionId
                                });
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (mentionIds_1_1 && !mentionIds_1_1.done && (_a = mentionIds_1.return)) _a.call(mentionIds_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        promise = new Promise(function (resolve) {
                            SfdcService.conn.chatter.resource("/feed-elements").create({
                                body: {
                                    messageSegments: messageSegments
                                },
                                feedElementType: "FeedItem",
                                subjectId: "me"
                            }, function (err, result) {
                                resolve(result);
                                if (err) {
                                    return console.error(err);
                                }
                                console.log("Id: " + result.id);
                                console.log("URL: " + result.url);
                                console.log("Body: " + result.body.messageSegments[0].text);
                            });
                        });
                        return [2, promise];
                }
            });
        });
    };
    SfdcService.prototype.getPickList = function (objectName, fieldName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pickListVal, promise;
            return tslib_1.__generator(this, function (_a) {
                if (!SfdcService.accessToken) {
                    this.login();
                }
                pickListVal = [];
                promise = new Promise(function (resolve) {
                    SfdcService.conn.sobject(objectName).describe(function (err, metadata) {
                        var e_2, _a, e_3, _b;
                        if (err) {
                            console.error(err);
                            return;
                        }
                        if (metadata.fields.length > 0) {
                            try {
                                for (var _c = tslib_1.__values(metadata.fields), _d = _c.next(); !_d.done; _d = _c.next()) {
                                    var field = _d.value;
                                    if (field.name == fieldName) {
                                        if (field.picklistValues && field.picklistValues.length > 0) {
                                            try {
                                                for (var _e = (e_3 = void 0, tslib_1.__values(field.picklistValues)), _f = _e.next(); !_f.done; _f = _e.next()) {
                                                    var pick = _f.value;
                                                    if (pick.active) {
                                                        pickListVal.push(pick);
                                                    }
                                                }
                                            }
                                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                            finally {
                                                try {
                                                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                                                }
                                                finally { if (e_3) throw e_3.error; }
                                            }
                                        }
                                    }
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            resolve(pickListVal);
                        }
                    });
                });
                return [2, promise];
            });
        });
    };
    SfdcService.prototype.getUserByPwd = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, null];
            });
        });
    };
    SfdcService.getInSql = function (iteratorList) {
        var e_4, _a;
        var inSql = "";
        try {
            for (var iteratorList_1 = tslib_1.__values(iteratorList), iteratorList_1_1 = iteratorList_1.next(); !iteratorList_1_1.done; iteratorList_1_1 = iteratorList_1.next()) {
                var searchItem = iteratorList_1_1.value;
                inSql += "'" + searchItem + "',";
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (iteratorList_1_1 && !iteratorList_1_1.done && (_a = iteratorList_1.return)) _a.call(iteratorList_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        inSql = "(" + inSql.substring(0, inSql.length - 1) + ")";
        return inSql;
    };
    SfdcService.getInSqlForNumber = function (iteratorList) {
        var e_5, _a;
        var inSql = "";
        try {
            for (var iteratorList_2 = tslib_1.__values(iteratorList), iteratorList_2_1 = iteratorList_2.next(); !iteratorList_2_1.done; iteratorList_2_1 = iteratorList_2.next()) {
                var searchItem = iteratorList_2_1.value;
                inSql += searchItem + ",";
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (iteratorList_2_1 && !iteratorList_2_1.done && (_a = iteratorList_2.return)) _a.call(iteratorList_2);
            }
            finally { if (e_5) throw e_5.error; }
        }
        inSql = "(" + inSql.substring(0, inSql.length - 1) + ")";
        return inSql;
    };
    SfdcService.prototype.getRecordType = function (sobjectType, developName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var soql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        soql = "select id,name,DeveloperName, SobjectType from RecordType where SobjectType = '" + sobjectType + "'";
                        if (developName) {
                            soql += " and DeveloperName = '" + developName + "'";
                        }
                        return [4, this.query(soql)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    SfdcService.prototype.getDomainUrl = function () {
        return this.authConfig.instanceUrl;
    };
    SfdcService.prototype.uploadContentVersion = function (metadata, file) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2, new Promise(function (resolve, reject) {
                            var r = request_1.default.post({
                                url: SfdcService.conn.instanceUrl + "/services/data/v51.0/sobjects/ContentVersion",
                                auth: {
                                    bearer: SfdcService.conn.accessToken
                                },
                                formData: {
                                    entity_content: {
                                        value: JSON.stringify(metadata),
                                        options: {
                                            contentType: "application/json"
                                        }
                                    },
                                    VersionData: {
                                        value: file,
                                        options: {
                                            filename: metadata.PathOnClient,
                                            contentType: "application/octet-stream"
                                        }
                                    }
                                }
                            }, function (err, response) {
                                if (err)
                                    reject(err);
                                resolve(JSON.parse(response.body));
                            });
                        })];
                }
            });
        });
    };
    SfdcService.prototype.uploadFile = function (metadata, file) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var formData;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!SfdcService.accessToken) return [3, 2];
                        return [4, this.login()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        formData = new form_data_1.default();
                        formData.setBoundary("boundary_string");
                        formData.append("entity_content", JSON.stringify(metadata), { contentType: "application/json" });
                        formData.append("VersionData", file, {
                            filename: metadata.PathOnClient,
                            contentType: "application/octet-stream"
                        });
                        return [2, axios_1.default({
                                method: "post",
                                maxContentLength: Infinity,
                                maxBodyLength: Infinity,
                                url: SfdcService.conn.instanceUrl + "/services/data/v51.0/sobjects/ContentVersion",
                                headers: {
                                    Authorization: "Bearer " + SfdcService.conn.accessToken,
                                    "Content-Type": "multipart/form-data; boundary=\"boundary_string\""
                                },
                                data: formData
                            })];
                }
            });
        });
    };
    SfdcService.prototype.linkFileToObj = function (contentVersionId, objId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, contentDocument;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = SfdcService.conn;
                        return [4, connection
                                .sobject("ContentVersion")
                                .retrieve(contentVersionId)];
                    case 1:
                        contentDocument = _a.sent();
                        return [2, connection.sobject("ContentDocumentLink").create({
                                ContentDocumentId: contentDocument.ContentDocumentId,
                                LinkedEntityId: objId,
                                ShareType: "I"
                            })];
                }
            });
        });
    };
    return SfdcService;
}());
exports.SfdcService = SfdcService;
//# sourceMappingURL=sfdc.service.js.map
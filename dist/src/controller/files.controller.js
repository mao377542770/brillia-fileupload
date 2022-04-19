"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var sfdc_service_1 = require("../service/sfdc.service");
var dotenv_1 = tslib_1.__importDefault(require("dotenv"));
var tools_service_1 = require("../service/tools.service");
var ms_service_1 = require("../service/ms.service");
dotenv_1.default.config();
var FilesController = (function () {
    function FilesController() {
        this.mssql = new ms_service_1.MsSql();
        this.sfdc = new sfdc_service_1.SfdcService();
    }
    FilesController.prototype.initCommonKarteInfo = function () {
        var e_1, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res, karteRes, batchList, batchList_1, batchList_1_1, batch, e_1_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.mssql.connect()];
                    case 1:
                        res = _b.sent();
                        return [4, this.mssql.query("SELECT TOP 15 * FROM CommonKarteInfo WHERE hasError is null")];
                    case 2:
                        karteRes = _b.sent();
                        if (!karteRes || karteRes.length === 0)
                            return [2];
                        batchList = tools_service_1.Tools.chunk(karteRes, FilesController.BATCHSIZE);
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 9, 10, 15]);
                        batchList_1 = tslib_1.__asyncValues(batchList);
                        _b.label = 4;
                    case 4: return [4, batchList_1.next()];
                    case 5:
                        if (!(batchList_1_1 = _b.sent(), !batchList_1_1.done)) return [3, 8];
                        batch = batchList_1_1.value;
                        return [4, this.executeUpload(batch)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3, 4];
                    case 8: return [3, 15];
                    case 9:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 15];
                    case 10:
                        _b.trys.push([10, , 13, 14]);
                        if (!(batchList_1_1 && !batchList_1_1.done && (_a = batchList_1.return))) return [3, 12];
                        return [4, _a.call(batchList_1)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [3, 14];
                    case 13:
                        if (e_1) throw e_1.error;
                        return [7];
                    case 14: return [7];
                    case 15:
                        this.mssql.disConnect();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.executeUpload = function (records) {
        var records_1, records_1_1;
        var e_2, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var excuteList, extidList, res, targetMap, _b, _c, resObj, rd, targetObj, e_2_1;
            var e_3, _d;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        excuteList = [];
                        extidList = records.map(function (obj) {
                            return obj.ExtId__c;
                        });
                        return [4, this.sfdc.query("SELECT Id,ExtId__c FROM CommonKarteInfo__c WHERE ExtId__c IN " + sfdc_service_1.SfdcService.getInSql(extidList))];
                    case 1:
                        res = _e.sent();
                        targetMap = new Map();
                        try {
                            for (_b = tslib_1.__values(res.records), _c = _b.next(); !_c.done; _c = _b.next()) {
                                resObj = _c.value;
                                targetMap.set(resObj.ExtId__c, resObj);
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 7, 8, 13]);
                        records_1 = tslib_1.__asyncValues(records);
                        _e.label = 3;
                    case 3: return [4, records_1.next()];
                    case 4:
                        if (!(records_1_1 = _e.sent(), !records_1_1.done)) return [3, 6];
                        rd = records_1_1.value;
                        targetObj = targetMap.get("" + rd.ExtId__c);
                        if (targetObj) {
                            rd.Id = targetObj.Id;
                            excuteList.push(this.uploadFileToCommonKarteInfo(rd));
                        }
                        else {
                            rd.hasError = 1;
                            rd.errorMsg = "SFDCに存在しないレコード";
                        }
                        _e.label = 5;
                    case 5: return [3, 3];
                    case 6: return [3, 13];
                    case 7:
                        e_2_1 = _e.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 13];
                    case 8:
                        _e.trys.push([8, , 11, 12]);
                        if (!(records_1_1 && !records_1_1.done && (_a = records_1.return))) return [3, 10];
                        return [4, _a.call(records_1)];
                    case 9:
                        _e.sent();
                        _e.label = 10;
                    case 10: return [3, 12];
                    case 11:
                        if (e_2) throw e_2.error;
                        return [7];
                    case 12: return [7];
                    case 13: return [4, Promise.all(excuteList)];
                    case 14:
                        _e.sent();
                        return [4, this.feedBackToDB(records)];
                    case 15:
                        _e.sent();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.uploadFileToCommonKarteInfo = function (targetRecord) {
        var e_4, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var filePathList, filePathList_1, filePathList_1_1, fileTgPath, filePath, filename, isExist, buffer, sfdc, contentVersion, error, uploadRes, linkRes, e_4_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        filePathList = [];
                        if (targetRecord.file1)
                            filePathList.push(targetRecord.file1);
                        if (targetRecord.file2)
                            filePathList.push(targetRecord.file2);
                        if (targetRecord.file3)
                            filePathList.push(targetRecord.file3);
                        if (targetRecord.file4)
                            filePathList.push(targetRecord.file4);
                        if (targetRecord.file5)
                            filePathList.push(targetRecord.file5);
                        if (!(filePathList.length !== 0)) return [3, 16];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, 11, 16]);
                        filePathList_1 = tslib_1.__asyncValues(filePathList);
                        _b.label = 2;
                    case 2: return [4, filePathList_1.next()];
                    case 3:
                        if (!(filePathList_1_1 = _b.sent(), !filePathList_1_1.done)) return [3, 9];
                        fileTgPath = filePathList_1_1.value;
                        filePath = FilesController.KARTE_ROOT_PATH + fileTgPath;
                        filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length);
                        return [4, fs_1.default.existsSync(filePath)];
                    case 4:
                        isExist = _b.sent();
                        if (!isExist) {
                            targetRecord.hasError = 0;
                            targetRecord.errorMsg = "[\u7BA1\u7406\u7D44\u5408\u5185\u90E8PID " + targetRecord.ExtId__c + "]:\u300C" + filePath + "\u300D\u30D5\u30A1\u30A4\u30EB\u304C\u5B58\u5728\u3057\u306A\u3044";
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        return [4, fs_1.default.readFileSync(filePath)];
                    case 5:
                        buffer = _b.sent();
                        sfdc = new sfdc_service_1.SfdcService();
                        contentVersion = {
                            Title: filename,
                            PathOnClient: filename
                        };
                        return [4, sfdc.uploadContentVersion(contentVersion, buffer).catch(function (err) {
                                error = err;
                                console.error(err);
                            })];
                    case 6:
                        uploadRes = _b.sent();
                        if (!uploadRes || !uploadRes.success) {
                            targetRecord.hasError = 1;
                            targetRecord.errorMsg = "[\u7BA1\u7406\u7D44\u5408\u5185\u90E8PID " + targetRecord.ExtId__c + "]:\u30D5\u30A1\u30A4\u30EB\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u5931\u6557:\n" + error;
                            console.error(uploadRes);
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        return [4, sfdc.linkFileToObj(uploadRes.id, targetRecord.Id)];
                    case 7:
                        linkRes = _b.sent();
                        if (!linkRes || !linkRes.success) {
                            targetRecord.hasError = 1;
                            targetRecord.errorMsg = "[\u7BA1\u7406\u7D44\u5408\u5185\u90E8PID " + targetRecord.ExtId__c + "]:\u30D5\u30A1\u30A4\u30EB\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u5931\u6557";
                            console.error(uploadRes);
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        _b.label = 8;
                    case 8: return [3, 2];
                    case 9: return [3, 16];
                    case 10:
                        e_4_1 = _b.sent();
                        e_4 = { error: e_4_1 };
                        return [3, 16];
                    case 11:
                        _b.trys.push([11, , 14, 15]);
                        if (!(filePathList_1_1 && !filePathList_1_1.done && (_a = filePathList_1.return))) return [3, 13];
                        return [4, _a.call(filePathList_1)];
                    case 12:
                        _b.sent();
                        _b.label = 13;
                    case 13: return [3, 15];
                    case 14:
                        if (e_4) throw e_4.error;
                        return [7];
                    case 15: return [7];
                    case 16:
                        if (!targetRecord.hasError) {
                            targetRecord.hasError = 0;
                        }
                        return [2, new Promise(function (resolve) {
                                resolve(targetRecord);
                            })];
                }
            });
        });
    };
    FilesController.prototype.feedBackToDB = function (records) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var updateSql, records_2, records_2_1, ckInfo;
            var e_5, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        updateSql = "";
                        try {
                            for (records_2 = tslib_1.__values(records), records_2_1 = records_2.next(); !records_2_1.done; records_2_1 = records_2.next()) {
                                ckInfo = records_2_1.value;
                                updateSql += "UPDATE CommonKarteInfo SET hasError = " + ckInfo.hasError + " " + (ckInfo.errorMsg ? ",errorMsg = '" + ckInfo.errorMsg + "'" : "") + " WHERE ExtId__c = '" + ckInfo.ExtId__c + "';\n";
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (records_2_1 && !records_2_1.done && (_a = records_2.return)) _a.call(records_2);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        return [4, this.mssql.query(updateSql)];
                    case 1:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.createTestFile = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var root, fileList, promiseList, _loop_1, fileList_1, fileList_1_1, fileStr, e_6_1;
            var e_6, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        root = "C:\\SalesforceWorkSpace\\brillia_data\\eBrilliaFile\\";
                        fileList = [
                            "000\\2175000\\fa7da290-6587-412f-9752-f1eb7a55c43f.pdf",
                            "001\\2175001\\7da3cc05-c240-4b24-ba72-688aefbf8b7c.pdf",
                            "002\\2175002\\c1f0913f-cb08-4811-9d23-8faf86d6c595.pdf",
                            "003\\2175003\\60e4dea9-88cb-4088-a8d8-76739e99c400.pdf",
                            "004\\2175004\\e629ba13-9e6e-45a6-9927-81ceb1d38246.pdf",
                            "005\\2175005\\92fb55bb-76ab-4af6-b283-0586e25480a6.pdf",
                            "006\\2175006\\58965c0e-88d9-426f-9f60-60c81c6e90be.pdf",
                            "007\\2175007\\8ff80c72-2a60-4d38-aa43-6e0b798a62ff.pdf",
                            "007\\289007\\5251d994-7882-4ae4-a45c-c06a7e4f66d5.pdf",
                            "008\\2175008\\6aaaa01a-8b06-410f-9cfd-147418083836.pdf",
                            "008\\289008\\4a4c9281-cb80-40a1-851e-ea6e1d818b61.pdf",
                            "009\\2175009\\ff752551-ad61-4202-baad-e62dcba6bcc2.pdf",
                            "009\\289009\\d7957978-af7b-4982-b2a9-4628218c2327.pdf",
                            "010\\2175010\\f8e516fd-debf-4a9c-8766-3fcd937e8d7e.pdf"
                        ];
                        promiseList = [];
                        _loop_1 = function (fileStr) {
                            var subStart, folderPath;
                            return tslib_1.__generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        subStart = fileStr.lastIndexOf("\\");
                                        folderPath = fileStr.substring(0, subStart);
                                        console.log(folderPath);
                                        promiseList.push(fs_1.default.mkdir(root + folderPath, { recursive: true }, function (err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            fs_1.default.writeFileSync(root + fileStr, "test");
                                        }));
                                        return [4, Promise.all(promiseList)];
                                    case 1:
                                        _c.sent();
                                        return [2];
                                }
                            });
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        fileList_1 = tslib_1.__values(fileList), fileList_1_1 = fileList_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!fileList_1_1.done) return [3, 5];
                        fileStr = fileList_1_1.value;
                        return [5, _loop_1(fileStr)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        fileList_1_1 = fileList_1.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_6_1 = _b.sent();
                        e_6 = { error: e_6_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (fileList_1_1 && !fileList_1_1.done && (_a = fileList_1.return)) _a.call(fileList_1);
                        }
                        finally { if (e_6) throw e_6.error; }
                        return [7];
                    case 8: return [2];
                }
            });
        });
    };
    FilesController.prototype.createTestFile2 = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var root, fileList, promiseList, fileList_2, fileList_2_1, mainStr, fileStr, fileList_4, _loop_2, fileList_3, fileList_3_1, fileStr_1;
            var e_7, _a, e_8, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        root = "C:\\SalesforceWorkSpace\\brillia_data\\cBrilliaFile\\FileUpload\\";
                        fileList = [
                            "?/58f02ac5-69ca-4022-bc44-b77b4174bc5f\\「ブリリアシティ千里津雲台」来客用駐車場案内図.pdf",
                            "?/7c214a12-1d23-477a-9280-cd3a65d36713\\「ブリリアシティ千里津雲台」来客用駐車場案内図.pdf",
                            "?/a2f68944-5b55-4559-ac15-24311c3449d8\\ゲストサロン案内図.pdf",
                            "?/a213525d-9d8b-4c8c-9e16-ac4dd0f52d33\\20181005133333.pdf",
                            "?/ef678ab6-a26e-4bfb-8ab6-407b962cf2e1\\招待状.pdf",
                            "?/e811c727-9563-479a-9789-43a32b5de3b4\\ご招待状.pdf",
                            "?/df5b2736-cbde-44f9-bd46-8639ead935c6\\マップ-MR-配置-0807＊.pdf",
                            "?/b7530614-6c98-406e-bc5f-bf2ccb5857e7\\マップ-MR-配置-0807＊.pdf",
                            "?/41ba155f-dede-4bfc-a0cc-c39bc89ef23a\\福原様招待状.pdf",
                            "?/66d57e13-b757-444e-8252-2a6b590f63e3\\百崎様招待状.pdf",
                            "?/8314cf24-70d1-4ef0-89c2-c13e558650db\\★予定価格表★.pdf?/fcccf92a-e78e-4193-a3b7-71e38546abe7\\★今後のスケジュール★.pdf?/296b2638-b1ef-49e8-8774-a47b06832a89\\★管理費等一覧★.pdf",
                            "?/224894c4-b2b2-43a0-933d-820c3df57fd2\\ご招待状.pdf",
                            "?/f5f0dc6c-6d0e-4371-b8ab-0254c3e903ae\\20181006192704木原様.pdf",
                            "?/daabb693-939f-491e-92a0-534f8713b96e\\ご招待状.pdf",
                            "?/6b93a89e-33e6-417d-930c-82ccedf316b0\\ゲストサロン案内図.pdf",
                            "?/2bc84c76-020a-459e-b19a-9a562d07bc10\\招待状（田中様).pdf",
                            "?/8d0c369a-7b2b-4ff2-a65a-e2e8ee7ce560\\伊藤様招待状.pdf",
                            "?/7f67c5a0-4859-45db-bc2e-ce146b5b7096\\ご招待状.pdf",
                            "?/f2b7a9fa-2124-4ab9-8f08-0b009b97494d\\提携駐車場のご案内.pdf",
                            "?/688f3a21-e6ef-43f9-9fa1-5f99b007f2a3\\首藤様.pdf"
                        ];
                        promiseList = [];
                        try {
                            for (fileList_2 = tslib_1.__values(fileList), fileList_2_1 = fileList_2.next(); !fileList_2_1.done; fileList_2_1 = fileList_2.next()) {
                                mainStr = fileList_2_1.value;
                                fileStr = mainStr.replaceAll("?/", "?\\");
                                fileList_4 = fileStr.split("?\\");
                                _loop_2 = function (fileStr_1) {
                                    if (!fileStr_1)
                                        return "continue";
                                    var subStart = fileStr_1.lastIndexOf("\\");
                                    var folderPath = fileStr_1.substring(0, subStart);
                                    console.log(folderPath);
                                    promiseList.push(fs_1.default.mkdir(root + folderPath, { recursive: true }, function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        fs_1.default.writeFileSync(root + fileStr_1, "test");
                                    }));
                                };
                                try {
                                    for (fileList_3 = (e_8 = void 0, tslib_1.__values(fileList_4)), fileList_3_1 = fileList_3.next(); !fileList_3_1.done; fileList_3_1 = fileList_3.next()) {
                                        fileStr_1 = fileList_3_1.value;
                                        _loop_2(fileStr_1);
                                    }
                                }
                                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                                finally {
                                    try {
                                        if (fileList_3_1 && !fileList_3_1.done && (_b = fileList_3.return)) _b.call(fileList_3);
                                    }
                                    finally { if (e_8) throw e_8.error; }
                                }
                            }
                        }
                        catch (e_7_1) { e_7 = { error: e_7_1 }; }
                        finally {
                            try {
                                if (fileList_2_1 && !fileList_2_1.done && (_a = fileList_2.return)) _a.call(fileList_2);
                            }
                            finally { if (e_7) throw e_7.error; }
                        }
                        return [4, Promise.all(promiseList)];
                    case 1:
                        _c.sent();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.initContact = function () {
        var e_9, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res, contactRes, batchList, batchList_2, batchList_2_1, batch, e_9_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.mssql.connect()];
                    case 1:
                        res = _b.sent();
                        return [4, this.mssql.query("SELECT TOP 20 * FROM Contact WHERE hasError is null")];
                    case 2:
                        contactRes = _b.sent();
                        if (!contactRes || contactRes.length === 0)
                            return [2];
                        batchList = tools_service_1.Tools.chunk(contactRes, FilesController.BATCHSIZE);
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 9, 10, 15]);
                        batchList_2 = tslib_1.__asyncValues(batchList);
                        _b.label = 4;
                    case 4: return [4, batchList_2.next()];
                    case 5:
                        if (!(batchList_2_1 = _b.sent(), !batchList_2_1.done)) return [3, 8];
                        batch = batchList_2_1.value;
                        return [4, this.executeUploadContact(batch)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3, 4];
                    case 8: return [3, 15];
                    case 9:
                        e_9_1 = _b.sent();
                        e_9 = { error: e_9_1 };
                        return [3, 15];
                    case 10:
                        _b.trys.push([10, , 13, 14]);
                        if (!(batchList_2_1 && !batchList_2_1.done && (_a = batchList_2.return))) return [3, 12];
                        return [4, _a.call(batchList_2)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [3, 14];
                    case 13:
                        if (e_9) throw e_9.error;
                        return [7];
                    case 14: return [7];
                    case 15:
                        this.mssql.disConnect();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.executeUploadContact = function (records) {
        var records_3, records_3_1;
        var e_10, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var excuteList, extidList, res, targetMap, _b, _c, resObj, rd, targetObj, e_10_1;
            var e_11, _d;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        excuteList = [];
                        extidList = records.map(function (obj) {
                            return obj.ContactId;
                        });
                        return [4, this.sfdc.query("SELECT Id,ContactNo__c FROM OpportunityHistory__c WHERE ContactNo__c IN " + sfdc_service_1.SfdcService.getInSqlForNumber(extidList))];
                    case 1:
                        res = _e.sent();
                        targetMap = new Map();
                        try {
                            for (_b = tslib_1.__values(res.records), _c = _b.next(); !_c.done; _c = _b.next()) {
                                resObj = _c.value;
                                targetMap.set(resObj.ContactNo__c, resObj);
                            }
                        }
                        catch (e_11_1) { e_11 = { error: e_11_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
                            }
                            finally { if (e_11) throw e_11.error; }
                        }
                        console.log(targetMap);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 7, 8, 13]);
                        records_3 = tslib_1.__asyncValues(records);
                        _e.label = 3;
                    case 3: return [4, records_3.next()];
                    case 4:
                        if (!(records_3_1 = _e.sent(), !records_3_1.done)) return [3, 6];
                        rd = records_3_1.value;
                        targetObj = targetMap.get(Number(rd.ContactId));
                        if (targetObj) {
                            rd.Id = targetObj.Id;
                            excuteList.push(this.uploadFileToContact(rd));
                        }
                        else {
                            rd.hasError = 1;
                            rd.errorMsg = "SFDCに存在しないレコード";
                        }
                        _e.label = 5;
                    case 5: return [3, 3];
                    case 6: return [3, 13];
                    case 7:
                        e_10_1 = _e.sent();
                        e_10 = { error: e_10_1 };
                        return [3, 13];
                    case 8:
                        _e.trys.push([8, , 11, 12]);
                        if (!(records_3_1 && !records_3_1.done && (_a = records_3.return))) return [3, 10];
                        return [4, _a.call(records_3)];
                    case 9:
                        _e.sent();
                        _e.label = 10;
                    case 10: return [3, 12];
                    case 11:
                        if (e_10) throw e_10.error;
                        return [7];
                    case 12: return [7];
                    case 13: return [4, Promise.all(excuteList)];
                    case 14:
                        _e.sent();
                        return [4, this.feedBackContactToDB(records)];
                    case 15:
                        _e.sent();
                        return [2];
                }
            });
        });
    };
    FilesController.prototype.uploadFileToContact = function (targetRecord) {
        var e_12, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var filePathList, i, filedName, filePathList_2, filePathList_2_1, fileTgPath, filePath, filename, isExist, buffer, sfdc, contentVersion, error, uploadRes, linkRes, e_12_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        filePathList = [];
                        for (i = 1; i <= 35; i++) {
                            filedName = "file" + i;
                            if (targetRecord[filedName]) {
                                filePathList.push(targetRecord[filedName]);
                            }
                        }
                        if (!(filePathList.length !== 0)) return [3, 16];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, 11, 16]);
                        filePathList_2 = tslib_1.__asyncValues(filePathList);
                        _b.label = 2;
                    case 2: return [4, filePathList_2.next()];
                    case 3:
                        if (!(filePathList_2_1 = _b.sent(), !filePathList_2_1.done)) return [3, 9];
                        fileTgPath = filePathList_2_1.value;
                        filePath = FilesController.KARTE_ROOT_PATH + fileTgPath;
                        filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length);
                        return [4, fs_1.default.existsSync(filePath)];
                    case 4:
                        isExist = _b.sent();
                        if (!isExist) {
                            targetRecord.hasError = 0;
                            targetRecord.errorMsg = "[\u30B3\u30F3\u30BF\u30AF\u30C8\u756A\u53F7 " + targetRecord.ContactId + "]:\u300C" + filePath + "\u300D\u30D5\u30A1\u30A4\u30EB\u304C\u5B58\u5728\u3057\u306A\u3044";
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        return [4, fs_1.default.readFileSync(filePath)];
                    case 5:
                        buffer = _b.sent();
                        sfdc = new sfdc_service_1.SfdcService();
                        contentVersion = {
                            Title: filename,
                            PathOnClient: filename
                        };
                        return [4, sfdc.uploadContentVersion(contentVersion, buffer).catch(function (err) {
                                error = err;
                                console.error(err);
                            })];
                    case 6:
                        uploadRes = _b.sent();
                        if (!uploadRes || !uploadRes.success) {
                            targetRecord.hasError = 1;
                            targetRecord.errorMsg = "[\u30B3\u30F3\u30BF\u30AF\u30C8\u756A\u53F7 " + targetRecord.ContactId + "]:\u30D5\u30A1\u30A4\u30EB\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u5931\u6557:\n" + error;
                            console.error(uploadRes);
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        return [4, sfdc.linkFileToObj(uploadRes.id, targetRecord.Id)];
                    case 7:
                        linkRes = _b.sent();
                        if (!linkRes || !linkRes.success) {
                            targetRecord.hasError = 1;
                            targetRecord.errorMsg = "[\u30B3\u30F3\u30BF\u30AF\u30C8\u756A\u53F7 " + targetRecord.ContactId + "]:\u30D5\u30A1\u30A4\u30EB\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u5931\u6557";
                            console.error(uploadRes);
                            console.error(targetRecord.errorMsg);
                            return [3, 9];
                        }
                        _b.label = 8;
                    case 8: return [3, 2];
                    case 9: return [3, 16];
                    case 10:
                        e_12_1 = _b.sent();
                        e_12 = { error: e_12_1 };
                        return [3, 16];
                    case 11:
                        _b.trys.push([11, , 14, 15]);
                        if (!(filePathList_2_1 && !filePathList_2_1.done && (_a = filePathList_2.return))) return [3, 13];
                        return [4, _a.call(filePathList_2)];
                    case 12:
                        _b.sent();
                        _b.label = 13;
                    case 13: return [3, 15];
                    case 14:
                        if (e_12) throw e_12.error;
                        return [7];
                    case 15: return [7];
                    case 16:
                        if (!targetRecord.hasError) {
                            targetRecord.hasError = 0;
                        }
                        return [2, new Promise(function (resolve) {
                                resolve(targetRecord);
                            })];
                }
            });
        });
    };
    FilesController.prototype.feedBackContactToDB = function (records) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var updateSql, records_4, records_4_1, ckInfo;
            var e_13, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        updateSql = "";
                        try {
                            for (records_4 = tslib_1.__values(records), records_4_1 = records_4.next(); !records_4_1.done; records_4_1 = records_4.next()) {
                                ckInfo = records_4_1.value;
                                updateSql += "UPDATE Contact SET hasError = " + ckInfo.hasError + " " + (ckInfo.errorMsg ? ",errorMsg = '" + ckInfo.errorMsg + "'" : "") + " WHERE ContactId = '" + ckInfo.ContactId + "';\n";
                            }
                        }
                        catch (e_13_1) { e_13 = { error: e_13_1 }; }
                        finally {
                            try {
                                if (records_4_1 && !records_4_1.done && (_a = records_4.return)) _a.call(records_4);
                            }
                            finally { if (e_13) throw e_13.error; }
                        }
                        return [4, this.mssql.query(updateSql)];
                    case 1:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    FilesController.BATCHSIZE = 10;
    FilesController.KARTE_ROOT_PATH = process.env.KARTE_ROOT_PATH;
    return FilesController;
}());
exports.FilesController = FilesController;
//# sourceMappingURL=files.controller.js.map
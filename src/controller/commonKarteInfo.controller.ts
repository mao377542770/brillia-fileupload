import fs from "fs"
import { CommonKarteInfo } from "../model/commonKarteInfo"

import dotenv from "dotenv"
import { SfdcService } from "../service/sfdc.service"
import { BatchBaseController } from "./base.controller"
import { Tools } from "../service/tools.service"

import { Contact } from "../model/contact"
import { ContactInfo } from "../model/contactInfo"

dotenv.config()

// 共用部住戸カルテファイル移行コントロール
export class CommonKarteInfoController extends BatchBaseController {
  tableName: string
  private static KARTE_ROOT_PATH = process.env.KARTE_ROOT_PATH
  private static CONTACT_ROOT_PATH = process.env.CONTACT_ROOT_PATH
  private SQL = process.env.KARTE_SQL ? process.env.KARTE_SQL : ""

  constructor() {
    super()
    this.tableName = "CommonKarteInfo"
  }

  /**
   * 共用部住戸カルテを移行する
   * @returns
   */
  public async init() {
    const karteRes = await this.mssql.query<CommonKarteInfo>(this.SQL)

    if (!karteRes || karteRes.length === 0) return
    const batchList = Tools.chunk<CommonKarteInfo>(karteRes, this.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUpload(batch)
    }
  }

  async executeUpload(records: CommonKarteInfo[]) {
    const excuteList = []
    // salesforceId を取得する
    const extidList = records.map(obj => {
      return obj.ExtId__c
    })
    const res = await this.sfdc.query<CommonKarteInfo>(
      `SELECT Id,ExtId__c FROM CommonKarteInfo__c WHERE ExtId__c IN ${SfdcService.getInSql(extidList)}`
    )
    const targetMap = new Map<string, CommonKarteInfo>()
    for (const resObj of res.records) {
      targetMap.set(resObj.ExtId__c, resObj)
    }
    // レコードIDを設定
    for await (const rd of records) {
      const targetObj = targetMap.get("" + rd.ExtId__c)
      if (targetObj) {
        rd.Id = targetObj.Id
        rd.SFDCId = targetObj.Id
        excuteList.push(this.uploadFileToCommonKarteInfo(rd))
      } else {
        rd.hasError = 1
        rd.errorMsg = "SFDCに存在しないレコード"
      }
    }

    await Promise.all(excuteList)

    // アップデート結果をDBに反映する
    await this.feedBackToDB(records)
  }

  /**
   * 住戸カルテにファイルをアップロード
   * @param targetRecord
   * @returns
   */
  async uploadFileToCommonKarteInfo(targetRecord: CommonKarteInfo): Promise<CommonKarteInfo> {
    const filePathList = []
    if (targetRecord.file1) filePathList.push({path: targetRecord.file1, name: targetRecord.file1Name})
    if (targetRecord.file2) filePathList.push({path: targetRecord.file2, name: targetRecord.file2Name})
    if (targetRecord.file3) filePathList.push({path: targetRecord.file3, name: targetRecord.file3Name})
    if (targetRecord.file4) filePathList.push({path: targetRecord.file4, name: targetRecord.file4Name})
    if (targetRecord.file5) filePathList.push({path: targetRecord.file5, name: targetRecord.file5Name})

    if (filePathList.length !== 0) {
      for await (const fileTgPath of filePathList) {
        // ファイルの読み込み
        const filePath = CommonKarteInfoController.KARTE_ROOT_PATH + fileTgPath.path
        const filename = fileTgPath.name
        const isExist = await fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[管理組合内部PID ${targetRecord.ExtId__c}]:「${filePath}」ファイルが存在しない`
          console.error(targetRecord.errorMsg)
          break
        }
        const buffer = await fs.readFileSync(filePath)
        // ファイルをSFDCにアップロード
        const sfdc = new SfdcService()
        const contentVersion = {
          Title: filename,
          PathOnClient: filename
        }

        let error
        const uploadRes = await sfdc.uploadContentVersion(contentVersion, buffer).catch(err => {
          error = err
          console.error(err)
        })

        if (!uploadRes || !uploadRes.success) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[管理組合内部PID ${targetRecord.ExtId__c}]:ファイルアップロード失敗:\n${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }

        let linkRes
        linkRes = await sfdc.linkFileToObj(uploadRes.id, targetRecord.Id).catch(err => {
          error = err
          console.error(err)
        })
        if (!linkRes || !linkRes.success || error) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[管理組合内部PID ${targetRecord.ExtId__c}]:ファイルアップロード失敗${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }
      }
    }
    if (!targetRecord.hasError) {
      targetRecord.hasError = 0
    }

    return new Promise<CommonKarteInfo>(resolve => {
      resolve(targetRecord)
    })
  }

  /**
   * アップデートした結果をDBに反映する
   * @param records
   */
  async feedBackToDB(records: CommonKarteInfo[]) {
    let updateSql = ""
    for (const ckInfo of records) {
      updateSql += `UPDATE CommonKarteInfo SET hasError = ${ckInfo.hasError} ${
        ckInfo.errorMsg ? `,errorMsg = '${ckInfo.errorMsg}'` : ""
      }${ckInfo.SFDCId ? `,SFDCId = '${ckInfo.SFDCId}'` : ""} WHERE ExtId__c = '${ckInfo.ExtId__c}';\n`
    }
    await this.mssql.query(updateSql)
  }
}

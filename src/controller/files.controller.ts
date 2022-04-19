import fs from "fs"
import { CommonKarteInfo } from "../model/commonKarteInfo"
import { SfdcService } from "../service/sfdc.service"
import dotenv from "dotenv"

import { BaseController } from "./base.controller"
import { Tools } from "../service/tools.service"
import { MsSql } from "../service/ms.service"
import { Contact } from "../model/contact"
import { ContactInfo } from "src/model/opportunityHistory__c"

dotenv.config()

export class FilesController implements BaseController {
  // 毎回同時に処理するレコード数
  private static BATCHSIZE = 10
  private static KARTE_ROOT_PATH = process.env.KARTE_ROOT_PATH
  private static CONTACT_ROOT_PATH = process.env.CONTACT_ROOT_PATH
  private mssql: MsSql
  private sfdc: SfdcService

  constructor() {
    this.mssql = new MsSql()
    this.sfdc = new SfdcService()
  }

  /**
   * 共用部住戸カルテを移行する
   * @returns
   */
  public async initCommonKarteInfo() {
    const res = await this.mssql.connect()

    const karteRes = await this.mssql.query<CommonKarteInfo>(
      "SELECT TOP 15 * FROM CommonKarteInfo WHERE hasError is null"
    )

    if (!karteRes || karteRes.length === 0) return
    const batchList = Tools.chunk<CommonKarteInfo>(karteRes, FilesController.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUpload(batch)
    }

    this.mssql.disConnect()
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
    if (targetRecord.file1) filePathList.push(targetRecord.file1)
    if (targetRecord.file2) filePathList.push(targetRecord.file2)
    if (targetRecord.file3) filePathList.push(targetRecord.file3)
    if (targetRecord.file4) filePathList.push(targetRecord.file4)
    if (targetRecord.file5) filePathList.push(targetRecord.file5)

    if (filePathList.length !== 0) {
      for await (const fileTgPath of filePathList) {
        // ファイルの読み込み
        const filePath = FilesController.KARTE_ROOT_PATH + fileTgPath
        const filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length)
        const isExist = await fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 0
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

        const linkRes = await sfdc.linkFileToObj(uploadRes.id, targetRecord.Id)
        if (!linkRes || !linkRes.success) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[管理組合内部PID ${targetRecord.ExtId__c}]:ファイルアップロード失敗`
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
      } WHERE ExtId__c = '${ckInfo.ExtId__c}';\n`
    }
    await this.mssql.query(updateSql)
  }

  /**
   * コンタクトを移行する
   * @returns
   */
  public async initContact() {
    const res = await this.mssql.connect()

    const contactRes = await this.mssql.query<Contact>("SELECT TOP 20 * FROM Contact WHERE hasError is null")

    if (!contactRes || contactRes.length === 0) return
    const batchList = Tools.chunk<Contact>(contactRes, FilesController.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUploadContact(batch)
    }

    this.mssql.disConnect()
  }

  async executeUploadContact(records: Contact[]) {
    // 反響履歴ID
    const updateList = []

    // 反響履歴IDを取得する
    const oppHisList = []
    // 折衝情報Idを取得する
    const ngList = []

    for (const ct of records) {
      if (ct.Type === "手段") {
        ngList.push(ct.ContactId)
      } else {
        oppHisList.push(ct.ContactId)
      }
    }

    const targetMap = new Map<number, ContactInfo>()

    // 反響履歴
    if (oppHisList.length > 0) {
      const res = await this.sfdc.query<ContactInfo>(
        `SELECT Id,ContactNo__c FROM OpportunityHistory__c WHERE ContactNo__c IN ${SfdcService.getInSqlForNumber(
          oppHisList
        )}`
      )
      for (const resObj of res.records) {
        targetMap.set(resObj.ContactNo__c, resObj)
      }
    }

    // 折衝情報
    if (ngList.length > 0) {
      const res = await this.sfdc.query<ContactInfo>(
        `SELECT Id,ContactNo__c FROM NegotiationInfo__c WHERE ContactNo__c IN ${SfdcService.getInSqlForNumber(ngList)}`
      )
      for (const resObj of res.records) {
        targetMap.set(resObj.ContactNo__c, resObj)
      }
    }

    // レコードIDを設定
    for await (const rd of records) {
      const targetObj = targetMap.get(Number(rd.ContactId))
      if (targetObj) {
        rd.Id = targetObj.Id
        updateList.push(this.uploadFileToContact(rd))
      } else {
        rd.hasError = 1
        rd.errorMsg = "SFDCに存在しないレコード"
      }
    }

    await Promise.all(updateList)

    // アップデート結果をDBに反映する
    await this.feedBackContactToDB(records)
  }

  /**
   * 住戸カルテにファイルをアップロード
   * @param targetRecord
   * @returns
   */
  async uploadFileToContact(targetRecord: Contact): Promise<Contact> {
    const filePathList = []
    for (let i = 1; i <= 35; i++) {
      const filedName = `file${i}`
      if (targetRecord[filedName]) {
        // 先ず「?/」を[?\]に変更
        let fileStr = targetRecord[filedName].replaceAll("?/", "?\\")
        const fileList = fileStr.split("?\\")
        filePathList.push(...fileList)
      }
    }

    if (filePathList.length !== 0) {
      for await (const fileTgPath of filePathList) {
        if (!fileTgPath) continue
        // ファイルの読み込み
        const filePath = FilesController.CONTACT_ROOT_PATH + fileTgPath
        const filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length)
        const isExist = await fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 0
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactId}]:「${filePath}」ファイルが存在しない`
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
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactId}]:ファイルアップロード失敗:\n${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }

        const linkRes = await sfdc.linkFileToObj(uploadRes.id, targetRecord.Id)
        if (!linkRes || !linkRes.success) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactId}]:ファイルアップロード失敗`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }
      }
    }
    if (!targetRecord.hasError) {
      targetRecord.hasError = 0
    }

    return new Promise<Contact>(resolve => {
      resolve(targetRecord)
    })
  }

  /**
   * アップデートした結果をDBに反映する
   * @param records
   */
  async feedBackContactToDB(records: Contact[]) {
    let updateSql = ""
    for (const ckInfo of records) {
      updateSql += `UPDATE Contact SET hasError = ${ckInfo.hasError} ${
        ckInfo.errorMsg ? `,errorMsg = '${ckInfo.errorMsg}'` : ""
      } WHERE ContactId = '${ckInfo.ContactId}';\n`
    }
    await this.mssql.query(updateSql)
  }
}

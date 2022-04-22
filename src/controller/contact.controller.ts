import fs from "fs"

import dotenv from "dotenv"
import { SfdcService } from "../service/sfdc.service"
import { BatchBaseController } from "./base.controller"
import { Tools } from "../service/tools.service"

import { Contact } from "../model/contact"
import { ContactInfo } from "../model/opportunityHistory__c"

dotenv.config()

// コンタクト情報ファイル移行コントロール
export class ContactController extends BatchBaseController {
  tableName: string
  private static CONTACT_ROOT_PATH = process.env.CONTACT_ROOT_PATH

  constructor() {
    super()
    this.tableName = "Contact"
  }

  /**
   * コンタクトを移行する
   * @returns
   */
  public async init() {
    const contactRes = await this.mssql.query<Contact>(`SELECT TOP 20 * FROM ${this.tableName} WHERE hasError is null`)

    if (!contactRes || contactRes.length === 0) return
    const batchList = Tools.chunk<Contact>(contactRes, this.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUploadContact(batch)
    }
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
        ngList.push(ct.ContactNo__c)
      } else {
        oppHisList.push(ct.ContactNo__c)
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
      const targetObj = targetMap.get(Number(rd.ContactNo__c))
      if (targetObj) {
        rd.Id = targetObj.Id
        rd.SFDCId = targetObj.Id
        updateList.push(this.uploadFileToContact(rd))
      } else {
        rd.hasError = 1
        rd.errorMsg = "SFDCに存在しないレコード"
      }
    }

    await Promise.all(updateList)

    // アップデート結果をDBに反映する
    await this.feedBackToDB(records)
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
        const filePath = ContactController.CONTACT_ROOT_PATH + fileTgPath
        const filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length)
        const isExist = await fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 0
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactNo__c}]:「${filePath}」ファイルが存在しない`
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
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactNo__c}]:ファイルアップロード失敗:\n${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }

        const linkRes = await sfdc.linkFileToObj(uploadRes.id, targetRecord.Id)
        if (!linkRes || !linkRes.success) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[コンタクト番号 ${targetRecord.ContactNo__c}]:ファイルアップロード失敗`
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
  async feedBackToDB(records: Contact[]) {
    let updateSql = ""
    for (const ckInfo of records) {
      updateSql += `UPDATE Contact SET hasError = ${ckInfo.hasError}${
        ckInfo.errorMsg ? `,errorMsg = '${ckInfo.errorMsg}'` : ""
      }${ckInfo.SFDCId ? `,SFDCId = '${ckInfo.SFDCId}'` : ""} WHERE ContactNo__c = '${ckInfo.ContactNo__c}';\n`
    }
    await this.mssql.query(updateSql)
  }
}

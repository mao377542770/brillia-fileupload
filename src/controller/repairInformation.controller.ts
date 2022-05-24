import fs from "fs"
import { SfdcService } from "../service/sfdc.service"
import dotenv from "dotenv"

import { BatchBaseController } from "./base.controller"
import { Tools } from "../service/tools.service"
import { RepairInformation } from "../model/repairInformation"

dotenv.config()

//管理組合補修情報ファイル移行コントロール
export class RepairInformationController extends BatchBaseController {
  tableName: string
  private ROOT_PATH = process.env.REPAIR_ROOT_PATH
  private SQL = process.env.REPAIR_SQL ? process.env.REPAIR_SQL : ""

  constructor() {
    super()
    this.tableName = "RepairInformation"
  }

  /**
   * 共用部住戸カルテを移行する
   * @returns
   */
  public async init() {
    const targetRes = await this.mssql.query<RepairInformation>(this.SQL)

    if (!targetRes || targetRes.length === 0) return
    const batchList = Tools.chunk<RepairInformation>(targetRes, this.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUpload(batch)
    }
  }

  async executeUpload(records: RepairInformation[]) {
    const excuteList = []
    // salesforceId を取得する
    const extidList = records.map(obj => {
      return obj.ExtId__c
    })
    const res = await this.sfdc.query<RepairInformation>(
      `SELECT Id,ExtId__c FROM RepairInformation__c WHERE ExtId__c IN ${SfdcService.getInSql(extidList)}`
    )
    const targetMap = new Map<string, RepairInformation>()
    for (const resObj of res.records) {
      targetMap.set(resObj.ExtId__c, resObj)
    }
    // レコードIDを設定
    for await (const rd of records) {
      const targetObj = targetMap.get("" + rd.ExtId__c)
      if (targetObj) {
        rd.Id = targetObj.Id
        rd.SFDCId = targetObj.Id
        excuteList.push(this.uploadFile(rd))
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
  async uploadFile(targetRecord: RepairInformation): Promise<RepairInformation> {
    const filePathList = []
    if (targetRecord.file1) filePathList.push(targetRecord.file1)
    if (targetRecord.file2) filePathList.push(targetRecord.file2)
    if (targetRecord.file3) filePathList.push(targetRecord.file3)
    if (targetRecord.file4) filePathList.push(targetRecord.file4)
    if (targetRecord.file5) filePathList.push(targetRecord.file5)

    if (filePathList.length !== 0) {
      for await (const fileTgPath of filePathList) {
        // ファイルの読み込み
        const filePath = this.ROOT_PATH + fileTgPath
        const filename = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.length)
        const isExist = await fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[${targetRecord.ExtId__c}]:「${filePath}」ファイルが存在しない`
          console.error(targetRecord.errorMsg)
          break
        }
        const buffer = await fs.readFileSync(filePath)
        // ファイルをSFDCにアップロード
        const contentVersion = {
          Title: filename,
          PathOnClient: filename
        }

        let error
        const uploadRes = await this.sfdc.uploadContentVersion(contentVersion, buffer).catch(err => {
          error = err
          console.error(err)
        })

        if (!uploadRes || !uploadRes.success) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[${targetRecord.ExtId__c}]:ファイルアップロード失敗:\n${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }

        const linkRes = await this.sfdc.linkFileToObj(uploadRes.id, targetRecord.Id).catch(err => {
          error = err
          console.error(err)
        })
        if (!linkRes || !linkRes.success || error) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[${targetRecord.ExtId__c}]:ファイルアップロード失敗${error}`
          console.error(uploadRes)
          console.error(targetRecord.errorMsg)
          break
        }
      }
    }
    if (!targetRecord.hasError) {
      targetRecord.hasError = 0
    }

    return new Promise<RepairInformation>(resolve => {
      resolve(targetRecord)
    })
  }
}

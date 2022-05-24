import dotenv from "dotenv"
import { SfdcService } from "../service/sfdc.service"
import { MsSql } from "../service/ms.service"

dotenv.config()
export abstract class BatchBaseController {
  // 毎回同時に処理するレコード数
  BATCHSIZE = Number(process.env.BATCHSIZE) | 10
  protected mssql: MsSql
  protected sfdc: SfdcService
  abstract tableName: string

  constructor() {
    this.mssql = new MsSql()
    this.sfdc = new SfdcService()
  }

  async runBatch() {
    await this.mssql.connect()
    await this.init()
    this.mssql.disConnect()
  }

  abstract init(): any

  /**
   * アップデートした結果をDBに反映する
   * @param records
   */
  async feedBackToDB(records: any[]) {
    let updateSql = ""
    for (const ckInfo of records) {
      updateSql += `UPDATE ${this.tableName} SET hasError = ${ckInfo.hasError}
      ${ckInfo.errorMsg ? `,errorMsg = N'${ckInfo.errorMsg}'` : ""}
      ${ckInfo.SFDCId ? `,SFDCId = '${ckInfo.SFDCId}'` : ""}
       WHERE ExtId__c = '${ckInfo.ExtId__c}';\n`
    }
    await this.mssql.query(updateSql)
  }
}

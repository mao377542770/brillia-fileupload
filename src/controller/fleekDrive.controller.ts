import { BatchBaseController } from "./base.controller"
import dotenv from "dotenv"
import { FleekDriveService } from "../service/fleekdrive.service"
import fs from "fs"
import { Account } from "../model/account"
import { Tools } from "../service/tools.service"
import { SfdcService } from "../service/sfdc.service"

dotenv.config()

//大項目フォルダマッピング表
const MajorItemMp = {
  PJアンケート関係: "アンケート関係",
  PJ販売関係: "販売関係",
  "PJ広告宣伝物・販売センター関連": "広告宣伝物・販売センター関連",
  PJ会議資料: "会議資料",
  PJ事業推進関係: "事業推進関係",
  PJ週報: "週報",
  "旧e-Brilliaファイル": "旧e-Brilliaファイル",
  情報共有: "情報共有"
}

//中項目フォルダマッピング表
const MediumItemMp = {
  "PJアンケート関係-アンケート関係": "アンケート関係",
  "PJアンケート関係-その他アンケート": "その他",
  "PJ販売関係-その他": "その他",
  "PJ販売関係-書類関連": "書類関連",
  "PJ広告・販売-その他": "その他",
  "PJ広告・販売-販売センター関連": "販売センター関連",
  "PJ広告・販売-広告宣伝物関係": "広告宣伝物関係",
  "PJ会議資料-その他": "その他",
  "PJ会議資料-会議資料": "会議資料",
  "PJ事業推進-JV契約関係": "JV契約関係",
  "PJ事業推進-PJ承継書類関係": "承継書類関係",
  "PJ事業推進-その他事業推進関係": "その他事業推進関係",
  "PJ事業推進-建築関係": "建築関係",
  "PJ事業推進-土地・許認可関係": "土地建物・許認可関係",
  "情報共有-Web報告": "Web報告",
  "情報共有-マニュアル関係": "マニュアル関係",
  "情報共有-各種調査報告": "各種調査報告",
  "情報共有-勉強会・報告会資料": "勉強会・報告会資料",
  "情報共有-特販チーム週報": "特販チーム週報",
  "情報共有-営業推進グループ週報": "営業推進グループ週報",
  "情報共有-週報集計": "週報集計",
  "情報共有-週報一括印刷用Excel": "週報一括印刷用Excel",
  "旧e-Bri定期補修アンケート": "定期補修アンケート",
  "旧e-Bri広告関連": "広告関連",
  "旧e-Bri旧掲示板": "旧掲示板",
  "旧e-Bri情報共有ミーティング資料": "情報共有ミーティング資料",
  "旧e-Bri認定中古マンション": "認定中古マンション",
  "旧e-Bri事業推進マニュアル（4社共有情報）": "事業推進マニュアル（4社共有情報）",
  "旧e-Bri事業推進上の問題点（東建・販社）": "事業推進上の問題点（東建・販社）"
}

//小項目フォルダマッピング表
const SmallItemMp = {
  "PJアンケート関係-Brillia建築現場見学会アンケート": "Brillia建築現場見学会アンケート",
  "PJアンケート関係-関係者確認会アンケート": "関係者確認会アンケート",
  "PJアンケート関係-内覧会アンケート": "内覧会アンケート",
  "PJその他アンケート-その他アンケート": "その他アンケート",
  "PJ販売関係-その他-その他販売関係": "入居時お客様配布資料",
  "PJ書類関連-アフターサービス規準": "アフターサービス規準",
  "PJ書類関連-その他お客様への提示資料": "変更事項等確認のお知らせ",
  "PJ書類関連-管理に関する説明書（長計含む）": "管理に関する説明書（長計含む）",
  "PJ書類関連-管理規約（修正含む）": "管理規約（修正含む）",
  "PJ書類関連-売買契約書": "売買契約書",
  "PJ書類関連-重説補足資料・お知らせ": "「重要事項説明書」補足説明",
  "PJ書類関連-重要事項説明書": "重要事項説明書",
  "PJ広告・販売-その他-その他広宣・販売センター関係": "",
  "PJ販売センター関連-MRガイド": "MRガイド",
  "PJ販売センター関連-MR販売センターパネル": "MR販売センターパネル",
  "PJ販売センター関連-MR写真": "MR写真",
  "PJ販売センター関連-OPガイド": "OPガイド",
  "PJ販売センター関連-日影図": "日影図",
  "PJ販売センター関連-価格表": "価格表",
  "PJ販売センター関連-眺望写真": "眺望写真",
  "PJ販売センター関連-営業ツール": "営業ツール",
  "PJ広告宣伝物関係-CGパース": "CGパース",
  "PJ広告宣伝物関係-オプション・セレクト資料": "オプション・セレクト資料",
  "PJ広告宣伝物関係-パンフレット": "パンフレット",
  "PJ広告宣伝物関係-メニュープラン表": "メニュープラン表",
  "PJ広告宣伝物関係-図面集": "図面集",
  "PJ広告宣伝物関係-図面集最終図": "図面集最終図",
  "PJ広告宣伝物関係-物件HP": "物件HP",
  "PJ広告宣伝物関係-物件チラシ": "物件チラシ",
  "PJ広告宣伝物関係-物件ロゴ": "物件ロゴ",
  "PJ広告宣伝物関係-現地地図": "現地地図",
  "PJ会議資料-その他-その他会議資料": "その他会議資料",
  "PJ会議資料-PJスタートMTG": "PJスタートMTG",
  "PJ会議資料-PJ戦略会議": "PJ戦略会議",
  "PJ会議資料-プロジェクトフィードバック会議": "プロジェクトフィードバック会議",
  "PJ会議資料-商品確定MTG": "商品確定MTG",
  "PJ会議資料-価格方針会議": "価格方針会議",
  "PJ会議資料-営業計画会議": "営業計画会議",
  "PJ会議資料-正価会議": "正価会議",
  "PJJV契約関係-JV協定書": "JV協定書",
  "PJJV契約関係-販売業務委託契約": "販売業務委託契約",
  "PJ事業推進-PJ承継書類関係-アフターサービス業務引継チェックリスト（最終版）":
    "アフターサービス業務引継チェックリスト（最終版）",
  "PJ事業推進-PJ承継書類関係-承継書類（個人情報）": "承継書類（個人情報）",
  "PJ事業推進-PJ承継書類関係-承継書類（個人情報以外）": "承継書類（個人情報以外）",
  "PJその他事業推進関係-その他事業推進関係": "その他事業推進関係",
  "PJ建築関係-簡易取扱説明書": "取扱説明書",
  "PJ建築関係-建築レポート": "建築レポート",
  "PJ建築関係-竣工写真": "竣工写真",
  "PJ建築関係-引渡書類（仕上一覧・業者一覧・メーカリスト等）": "引渡書類（仕上一覧・業者一覧・メーカリスト等）",
  "PJ土地・許認可関係-フラット適合証明": "フラット適合証明",
  "PJ土地・許認可関係-地積測量図": "地積測量図",
  "PJ土地・許認可関係-付定通知書": "付定通知",
  "PJ土地・許認可関係-公図（合筆前後）": "公図（合筆前後）",
  "PJ土地・許認可関係-検査済書": "検査済証",
  "PJ土地・許認可関係-建築確認済書（計画変更含む）": "建築確認済証（計画変更含む）",
  "PJ土地・許認可関係-建築確認申請書（計画変更含む）": "建築確認申請書（計画変更含む）",
  "PJ土地・許認可関係-納税通知書": "納税通知書",
  "PJ土地・許認可関係-求積図": "求積図",
  "PJ土地・許認可関係-全部事項証明書": "謄本",
  "PJ土地・許認可関係-謄本": "謄本"
}

// 共通フォルダ
const commPath = ["旧e-Brilliaファイル", "情報共有"]

export class FleekDriveController extends BatchBaseController {
  private static PROJECT_ROOT_PATH = process.env.PROJECT_ROOT_PATH

  private SQL = process.env.PROJECT_SQL ? process.env.PROJECT_SQL : ""
  private comPanySpaceId = process.env.FLEEK_COMMFOLDER_SFDCID

  private fleekService: FleekDriveService

  //スペースのマップ情報を作成する
  //key : 大中小項目のPathのコンタクト情報
  //value: spaceId
  private spaceIdMap = new Map<string, string>()

  tableName: string

  constructor() {
    super()
    this.tableName = ""
    this.fleekService = new FleekDriveService()
  }

  /**
   * 共用部住戸カルテを移行する
   * @returns
   */
  public async init() {
    //FleekDrive認証
    await this.fleekService.authentication()

    const queryREs = await this.mssql.query<Account>(this.SQL)

    if (!queryREs || queryREs.length === 0) return
    const batchList = Tools.chunk<Account>(queryREs, this.BATCHSIZE)

    for await (const batch of batchList) {
      await this.executeUpload(batch)
    }
  }

  async executeUpload(records: Account[]) {
    const excuteList = []
    // salesforceId を取得する
    let extidList = []
    for (const dbRecord of records) {
      if (dbRecord.ProjectCode) {
        extidList.push(dbRecord.ProjectCode)
      } else {
        excuteList.push(this.uploadFile(dbRecord))
      }
    }
    // 重複排除
    extidList = Array.from(new Set(extidList))
    if (extidList.length > 0) {
      const res = await this.sfdc.query<Account>(
        `SELECT Id,ProjectCode__c FROM Account WHERE ProjectCode__c IN ${SfdcService.getInSql(extidList)}`
      )
      const targetMap = new Map<string, Account>()
      for (const resObj of res.records) {
        targetMap.set(resObj.ProjectCode__c, resObj)
      }
      // レコードIDを設定
      for (const rd of records) {
        if (!rd.ProjectCode) continue
        const targetObj = targetMap.get("" + rd.ProjectCode)
        if (targetObj) {
          rd.Id = targetObj.Id
          rd.SFDCId = targetObj.Id
          excuteList.push(this.uploadFile(rd))
        } else {
          rd.hasError = 1
          rd.errorMsg = "SFDCに存在しないレコード"
        }
      }
    }

    await Promise.all(excuteList)

    // アップデート結果をDBに反映する
    await this.feedBackToDB(records)
  }

  private async uploadFile(targetRecord: Account) {
    const filePathList = []
    filePathList.push(targetRecord.File)

    let parentSpaceId
    //全社共通フォルダの判断
    if (commPath.includes(targetRecord.MajorItem)) {
      parentSpaceId = this.comPanySpaceId
    } else {
      // 関連親フォルダーを取得する
      parentSpaceId = await this.fleekService.getRelatedListBySfdcId(targetRecord.Id)
    }

    if (!parentSpaceId) {
      targetRecord.hasError = 1
      targetRecord.errorMsg = `[プロジェクトコード ${targetRecord.ProjectCode}]:」該当レコードの関連フォルダーが存在しない`
      console.error(targetRecord.errorMsg)
      return
    }

    // 移行対象のスペースIdを取得する
    const subSpaceId = await this.getSpaceIdByMapping(targetRecord, parentSpaceId)
    if (!subSpaceId) {
      return
    }

    if (filePathList.length !== 0) {
      for await (const fileTgPath of filePathList) {
        if (!fileTgPath) continue
        // ファイルの読み込み
        const filePath = FleekDriveController.PROJECT_ROOT_PATH + fileTgPath
        const isExist = fs.existsSync(filePath)
        if (!isExist) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[プロジェクトコード ${targetRecord.ProjectCode}]:「${filePath}」ファイルが存在しない`
          console.error(targetRecord.errorMsg)
          break
        }
        const buffer = fs.readFileSync(filePath)
        // const buffer = fs.createReadStream(filePath)
        // ファイルをSFDCにアップロード

        let error
        // スリーブ時間を設定
        await this.sleep(300)
        await this.fleekService.uploadFile(subSpaceId, targetRecord.FileName, buffer).catch(err => {
          error = err
        })

        if (error) {
          targetRecord.hasError = 1
          targetRecord.errorMsg = `[プロジェクトコード ${targetRecord.ProjectCode}]:${error}`
          console.error(targetRecord.errorMsg)
        }

        if (!targetRecord.hasError) {
          targetRecord.hasError = 0
        }
      }
    }

    return targetRecord
  }

  /**
   *
   * @param targetRecord
   */
  private async getSpaceIdByMapping(targetRecord: Account, parentSpaceId: string) {
    const spacePath: string[] = []
    // 大項目
    if (targetRecord.MajorItem) {
      spacePath.push(MajorItemMp[targetRecord.MajorItem])
    }
    // 中項目
    if (targetRecord.MediumItem) {
      spacePath.push(MediumItemMp[targetRecord.MediumItem])
    }
    // 小項目
    if (targetRecord.SmallItem) {
      if (SmallItemMp[targetRecord.SmallItem]) {
        spacePath.push(SmallItemMp[targetRecord.SmallItem])
      }
    }
    if (spacePath.length == 0) return
    const spaceKey = spacePath.reduce((pVal, cVal) => {
      return pVal + (cVal ? cVal : "")
    })

    // FleekDrive のスペースを検索
    let subSpaceId
    // 先ずマップから取得する
    subSpaceId = this.spaceIdMap.get(spaceKey + targetRecord.ProjectCode)
    if (!subSpaceId) {
      subSpaceId = await this.fleekService.searchSubSpace(parentSpaceId, spacePath)
      if (subSpaceId) this.spaceIdMap.set(spaceKey + targetRecord.ProjectCode, subSpaceId)
    }
    if (!subSpaceId) {
      targetRecord.hasError = 1
      targetRecord.errorMsg = `[プロジェクトコード ${targetRecord.ProjectCode}]:「${spacePath}」スペースが存在しない`
    }
    return subSpaceId
  }

  /**
   * アップデートした結果をDBに反映する
   * @param records
   */
  async feedBackToDB(records: Account[]) {
    let updateSql = ""
    for (const ckInfo of records) {
      updateSql += `UPDATE Account SET hasError = ${ckInfo.hasError}
      ${ckInfo.errorMsg ? `,errorMsg = N'${ckInfo.errorMsg}'` : ""}
      ${ckInfo.SFDCId ? `,SFDCId = '${ckInfo.SFDCId}'` : ""} WHERE Pid = '${ckInfo.Pid}';\n`
    }
    await this.mssql.query(updateSql)
  }

  private async sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
  }
}

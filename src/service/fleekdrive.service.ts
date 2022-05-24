/* eslint-disable @typescript-eslint/camelcase */
import axios from "axios"
import request from "request"

export class FleekDriveService {
  // 認証Cookie
  private authCookie: string | undefined

  private driveConfig = {
    fleekDriverId: process.env.FLEEK_DRIVER_ID,
    fleekDriverTk: process.env.FLEEK_DRIVER_TK,
    fleekDriverSpaceId: process.env.FLEEK_DRIVER_SPACE_ID,
    fleekDriverEndpoint: process.env.FLEEK_DRIVER_ENDPOINT,
    fleekDriverListId: process.env.FLEEK_DRIVER_LISTID
  }

  // 認証
  public async authentication() {
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/common/Authentication.json", {
        params: {
          id: this.driveConfig.fleekDriverId,
          tk: this.driveConfig.fleekDriverTk
        },
        withCredentials: true
      })
      .then(res => {
        const authCookies = res.headers["set-cookie"]
        this.authCookie = ""
        if (authCookies) {
          for (const cookie of authCookies) {
            this.authCookie += cookie + ";"
          }
        }
      })
      .catch(error => {
        console.error(error)
      })
  }

  // 関連リストのスペースIdを取得する
  public async getRelatedListBySfdcId(sfdcId: string): Promise<string | undefined> {
    const recordId = sfdcId.substring(0, 15)
    let subPaceId: string
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/relatedListRecordGetV2.json", {
        params: {
          sf_objId: recordId,
          list_id: this.driveConfig.fleekDriverListId,
          thumb: 1,
          isDrilldown: false,
          isCurrent: 0,
          rows: 100,
          page: 1,
          sidx: "name",
          sord: "asc"
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        if (res.data && res.data.rows !== 0) {
          subPaceId = res.data.rows[0].id
        }
      })
      .catch(error => {
        console.error(error)
      })

    return new Promise<any>(resolve => {
      resolve(subPaceId)
    })
  }

  // 関連ファイル一覧取得
  public async getContentsRelationList(recordId: string | undefined): Promise<any> {
    recordId = recordId ? recordId : "0011m00000SvSEP"
    let result: any
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/contentsRelationListGet.json", {
        params: {
          objid: recordId
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        result = res.data
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    return new Promise<any>(resolve => {
      resolve(result)
    })
  }

  // スペース・ファイル一覧取得
  public async getSpaceContentsList(spaceId: string, searchStr: string): Promise<any> {
    let result: any
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/spaceContentsListV2Get.json", {
        params: {
          asrt: "COMPANY",
          spaceId: spaceId,
          sord: "asc",
          rows: 100,
          sidx: "name",
          page: 1,
          searchstr: searchStr
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        result = res.data
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    return new Promise<any>(resolve => {
      resolve(result)
    })
  }

  /**
   * SFDCId により全てのサブスペースを出力する
   * @param parentSpaceId
   * @param folderName フォルダー名
   * @returns
   */
  public async getSubSpaceId(parentSpaceId: string, folderName: string) {
    // サブスペースを検索
    const spaceList = await this.getSpaceContentsList(parentSpaceId, "")

    if (!spaceList || spaceList.rows === 0) {
      return
    }

    // スペースID
    let subSpaceId
    for (const space of spaceList.rows) {
      if (space.isSpace && space.simpleName === folderName) {
        subSpaceId = space.id
      }
    }
    return subSpaceId
  }

  /**
   * フォルダPathにより、スペースIdを検索する
   * @param parentSubId
   * @param folderPath
   */
  public async searchSubSpace(parentSubId: string, folderPath: string[]) {
    let subSpaceId = parentSubId
    for await (const childPath of folderPath) {
      subSpaceId = await this.getSubSpaceId(subSpaceId, childPath)
      if (!subSpaceId) {
        return null
      }
    }
    return subSpaceId
  }

  // ファイル一覧取得
  public async getContentsList(spaceId: string): Promise<any> {
    let result: any
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/common/ContentsListGet.json", {
        params: {
          sord: "asc",
          rows: 100,
          sidx: "name",
          page: 1,
          ids: `["${spaceId}"]`,
          includeSubSpace: 1
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        result = res.data
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    return new Promise<any>(resolve => {
      resolve(result)
    })
  }

  // ファイルダウンロード
  public async downloadContents(docId: string): Promise<any> {
    let result: any

    let downLoadId
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/SingleContentsDownloadApi.json", {
        params: {
          fileId: docId
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        downLoadId = res.data.id
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    if (!downLoadId) return
    await axios
      .get(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/ContentsDownloadApi.json", {
        params: {
          id: downLoadId
        },
        withCredentials: true,
        headers: {
          Cookie: this.authCookie ? this.authCookie : ""
        },
        responseType: "stream"
      })
      .then(res => {
        result = res.data
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    return new Promise<any>(resolve => {
      resolve(result)
    })
  }

  // ファイルアップロード(axios-廃止)
  /**
  public async uploadFile(spaceId: string, fileName: string, fileBuffer: Buffer): Promise<any> {
    const formData = new FormData()
    const today = new Date()
    formData.append("filename", `${fileName}_${today.getTime()}.xlsx`)
    formData.append("spaceid", spaceId)
    formData.append("checkNewVersion", "0")
    formData.append("verUp", "")
    formData.append("verUpType", "auto")
    formData.append("versionkind", "0")
    formData.append("file", fileBuffer)

    let result: any
    await axios
      .post(this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/ContentsAdd.json", formData, {
        headers: {
          ...formData.getHeaders(),
          Cookie: this.authCookie ? this.authCookie : ""
        }
      })
      .then(res => {
        result = res.data
      })
      .catch(error => {
        console.error(error)
        result = null
      })

    return new Promise<any>(resolve => {
      resolve(result)
    })
  }
  */

  // ファイルアップロード
  public async uploadFile(spaceId: string, fileName: string, fileBuffer: Buffer): Promise<any> {
    const httpOption = {
      url: this.driveConfig.fleekDriverEndpoint + "/contentsmanagement/ContentsAdd.json",
      headers: {
        Cookie: this.authCookie ? this.authCookie : "",
        "Cache-Control": "no-cache",
        "Content-Type": "multipart/form-data"
      }
    }

    const promise = new Promise<any>((resolve, reject) => {
      const r = request.post(httpOption, (error: any, response: any, body: any) => {
        if (error) {
          reject(error)
        }

        resolve({
          error: error,
          response: response,
          body: body,
          fileName: fileName
        })
      })
      const formData = r.form()
      formData.append("filename", fileName)
      formData.append("spaceid", spaceId)
      formData.append("checkNewVersion", "0")
      formData.append("verUp", "on")
      formData.append("verUpType", "auto")
      formData.append("versionkind", "0")
      formData.append("file", fileBuffer, { filename: fileName })
    })

    return promise
  }
}

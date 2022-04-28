import { RecordType } from "../model/recordtype"
import { Connection, QueryResult, UserInfo, RecordResult } from "jsforce"
import request from "request"
import { ContentVersion } from "src/model/contentVersion"
import FormData from "form-data"
import axios from "axios"

export class SfdcService {
  // sfdc アクセストークン
  private static accessToken?: string
  private authConfig = {
    oauth2: {
      loginUrl: process.env.SFDC_DOMAIN,
      clientId: process.env.SFDC_CLIENTID,
      clientSecret: process.env.SFDC_CLIENTSECRET,
      redirectUri: process.env.SFDC_REDIRECTURI
    },
    instanceUrl: process.env.SFDC_INSTANCEURL ? process.env.SFDC_INSTANCEURL : "",
    accessToken: "",
    refreshToken: ""
  }
  private loginUser = {
    username: process.env.SFDC_USERNAME ? process.env.SFDC_USERNAME : "",
    password: process.env.SFDC_PASSWORD ? process.env.SFDC_PASSWORD : ""
  }
  //ログインユーザーの情報
  private userInfo?: UserInfo
  private static conn: Connection

  constructor() {
    if (!SfdcService.conn) {
      SfdcService.conn = new Connection(this.authConfig)
      SfdcService.conn.on("refresh", (newAccessToken, res) => {
        console.log("Access token refreshed")
        SfdcService.accessToken = newAccessToken
        this.authConfig.accessToken = newAccessToken
      })
    }
  }

  private async login() {
    if (SfdcService.conn) {
      await SfdcService.conn.login(this.loginUser.username, this.loginUser.password, (err, userinfo: UserInfo) => {
        if (err) {
          return console.error(err)
        }
        this.userInfo = userinfo
        SfdcService.accessToken = SfdcService.conn.accessToken
        this.authConfig.accessToken = SfdcService.accessToken
      })
    }
  }

  public async query<T>(query: string): Promise<QueryResult<T>> {
    if (!SfdcService.accessToken) {
      await this.login()
    }
    console.log("[REST SOQL]:" + query)
    const promise = new Promise<QueryResult<T>>(resolve => {
      SfdcService.conn.query<T>(query, undefined, (_err, _result) => {
        if (_err) {
          console.error(_err)
          throw _err
        }
        console.log("total : " + _result.totalSize)
        console.log("fetched : " + _result.records.length)
        resolve(_result)
      })
    })

    return promise
  }

  public async bulkQuery(query: string, pollInterval?: number, pollTimeout?: number) {
    if (!SfdcService.accessToken) {
      await this.login()
    }
    console.log("[BULK SOQL]:" + query)
    // プル間隔
    SfdcService.conn.bulk.pollInterval = pollInterval ? pollInterval : 2000
    // タイムアウト時間
    SfdcService.conn.bulk.pollTimeout = pollTimeout ? pollTimeout : 600000
    // レコードストリームを返却する
    return SfdcService.conn.bulk.query(query)
  }

  /**
   *
   * @param message chatterを送信する
   * @param mentionIds メンション対象
   * @returns
   */
  public async sendChatter<T>(message: string, mentionIds: string[], url?: string): Promise<QueryResult<T>> {
    if (!SfdcService.accessToken) {
      await this.login()
    }

    const messageSegments: any = [{ type: "Text", text: message }]
    if (url) {
      messageSegments.push({
        type: "LINK",
        url: url
      })
    }

    messageSegments.push({
      type: "Text",
      text: `
      作成者:
      `
    })

    // メンション対象を設定
    for (const mentionId of mentionIds) {
      messageSegments.push({
        type: "Mention",
        id: mentionId
      })
    }

    const promise = new Promise<QueryResult<T>>(resolve => {
      SfdcService.conn.chatter.resource("/feed-elements").create(
        {
          body: {
            messageSegments: messageSegments
          },
          feedElementType: "FeedItem",
          subjectId: "me"
        },
        (err, result: any) => {
          resolve(result)
          if (err) {
            return console.error(err)
          }
          console.log("Id: " + result.id)
          console.log("URL: " + result.url)
          console.log("Body: " + result.body.messageSegments[0].text)
        }
      )
    })

    return promise
  }

  public async getPickList(objectName: string, fieldName: string): Promise<any> {
    if (!SfdcService.accessToken) {
      this.login()
    }
    const pickListVal: any[] = []
    const promise = new Promise<any>(resolve => {
      SfdcService.conn.sobject(objectName).describe(function(err, metadata) {
        if (err) {
          console.error(err)
          return
        }
        if (metadata.fields.length > 0) {
          for (const field of metadata.fields) {
            if (field.name == fieldName) {
              if (field.picklistValues && field.picklistValues.length > 0) {
                for (const pick of field.picklistValues) {
                  if (pick.active) {
                    pickListVal.push(pick)
                  }
                }
              }
            }
          }
          resolve(pickListVal)
        }
      })
    })
    return promise
  }

  public async getUserByPwd(): Promise<any> {
    return null
  }

  public static getInSql(iteratorList: IterableIterator<string> | string[]): string {
    let inSql = ""
    for (const searchItem of iteratorList) {
      inSql += `'${searchItem}',`
    }
    inSql = "(" + inSql.substring(0, inSql.length - 1) + ")"
    return inSql
  }

  public static getInSqlForNumber(iteratorList: IterableIterator<string> | string[]): string {
    let inSql = ""
    for (const searchItem of iteratorList) {
      inSql += `${searchItem},`
    }
    inSql = "(" + inSql.substring(0, inSql.length - 1) + ")"
    return inSql
  }

  /**
   * レコードタイプを取得する
   * @param sobjectType Sobject API
   * @param developName レコードタイプのAPI名
   * @returns
   */
  public async getRecordType(sobjectType: string, developName?: string): Promise<QueryResult<RecordType>> {
    let soql = `select id,name,DeveloperName, SobjectType from RecordType where SobjectType = '${sobjectType}'`
    if (developName) {
      soql += ` and DeveloperName = '${developName}'`
    }
    return await this.query<RecordType>(soql)
  }

  public getDomainUrl(): string {
    return this.authConfig.instanceUrl
  }

  // ファイルアップロード
  async uploadContentVersion(metadata: ContentVersion, file: Buffer): Promise<RecordResult> {
    if (!SfdcService.accessToken) {
      await this.login()
    }

    return new Promise((resolve, reject) => {
      // const formData = new FormData()

      // formData.append("entity_content", JSON.stringify(metadata), { contentType: "application/json" })
      // formData.append("VersionData", file, {
      //   filename: metadata.PathOnClient,
      //   contentType: "application/octet-stream"
      // })

      const r = request.post(
        {
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
        },
        (err, response) => {
          if (err) reject(err)

          resolve(JSON.parse(response.body))
        }
      )
    })
  }

  // ファイルアップロード (axios) バージョン
  async uploadFile(metadata: ContentVersion, file: Buffer): Promise<any> {
    if (!SfdcService.accessToken) {
      await this.login()
    }

    const formData = new FormData()
    formData.setBoundary("boundary_string")
    formData.append("entity_content", JSON.stringify(metadata), { contentType: "application/json" })
    formData.append("VersionData", file, {
      filename: metadata.PathOnClient,
      contentType: "application/octet-stream"
    })
    return axios({
      method: "post",
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      url: SfdcService.conn.instanceUrl + "/services/data/v51.0/sobjects/ContentVersion",
      headers: {
        Authorization: "Bearer " + SfdcService.conn.accessToken,
        "Content-Type": `multipart/form-data; boundary=\"boundary_string\"`
      },
      data: formData
    })
  }

  // ファイルをオブジェクトにリンクする
  async linkFileToObj(contentVersionId: string, objId: string, ShareType?: string): Promise<RecordResult> {
    const connection = SfdcService.conn

    const contentDocument = await connection
      .sobject<{
        Id: string
        ContentDocumentId: string
      }>("ContentVersion")
      .retrieve(contentVersionId)

    return new Promise((resolve, reject) => {
      connection
        .sobject<any>("ContentDocumentLink")
        .create({
          ContentDocumentId: contentDocument.ContentDocumentId,
          LinkedEntityId: objId,
          ShareType: ShareType ? ShareType : "I"
        })
        .then(recordResult => {
          resolve(recordResult)
        })
        .catch(error => {
          reject(error)
        })
    })
  }
}

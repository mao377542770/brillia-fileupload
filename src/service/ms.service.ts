import { Connection, Request } from "tedious"

export class MsSql {
  private connection: Connection
  private isConnectFlag = false

  private config = {
    server: process.env.MSSSQL_HOST, //update me
    authentication: {
      type: "default",
      options: {
        userName: process.env.MSSSQL_USER, //update me
        password: process.env.MSSSQL_PASSWORD //update me
      }
    },
    options: {
      port: 1433,
      // If you are on Microsoft Azure, you need encryption:
      encrypt: true,
      database: process.env.MSSSQL_DATABASE, //update me
      trustServerCertificate: true,
      // ※追加：コールバックで値を取得
      rowCollectionOnRequestCompletion: true
    }
  }

  constructor() {
    this.connection = new Connection(this.config)
  }

  //DB接続
  connect(): Promise<any> {
    this.connection.connect()
    return new Promise<any>((resolve, reject) => {
      this.connection.on("connect", err => {
        if (err) {
          reject(err)
        } else {
          this.isConnectFlag = true
          resolve("DB接続成功")
        }
      })
    })
  }

  // DB接続しているかどうか
  get isConnect(): Boolean {
    return this.isConnectFlag
  }

  disConnect() {
    this.connection.close()
    this.isConnectFlag = false
  }

  query<T>(sql: string): Promise<T[]> {
    if (!this.isConnect) {
      this.connection.connect()
    }

    return new Promise<T[]>((resolve, reject) => {
      const request = new Request(sql, (err, rowCount, rows) => {
        console.info(`[SQL]:${sql}`)
        if (err) {
          console.error(err)
          reject(err)
          return
        }
        console.info(`[取得件数]:${rowCount}`)
        const records: any = []
        for (const row of rows) {
          const obj = {}
          for (const col of row) {
            if (col.value) {
              obj[col.metadata.colName] = col.value
            }
          }
          records.push(obj)
        }
        resolve(records as T[])
      })

      this.connection.execSql(request)
    })
  }
}

import dotenv from "dotenv"
import { FilesController } from "./controller/files.controller"
import readLine from "readline"
import { testController } from "./controller/test.controller"

dotenv.config()

export default class App {
  constructor() {
    this.init()
  }

  async init() {
    const fileCtl = new FilesController()

    console.log(`
    移行対象をご選択ください:
      1.共用部住戸カルテ
      2.コンタクト情報
    `)

    const rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    // Enterを監視する
    rl.on("line", async str => {
      if (str === "1") {
        console.log("===共用部住戸カルテ移行開始===")
        await fileCtl.initCommonKarteInfo()
      } else if (str == "2") {
        console.log("===コンタクト情報移行開始===")
        await fileCtl.initContact()
      } else {
        await new testController().createTestFile()
      }
      rl.close()
    })

    // 監視終了
    rl.on("close", () => {
      console.log("===**移行終了**===")
    })
  }
}

new App()

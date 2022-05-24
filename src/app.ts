import dotenv from "dotenv"
import { CommonKarteInfoController } from "./controller/commonKarteInfo.controller"
import readLine from "readline"
import { testController } from "./controller/test.controller"
import { ContactController } from "./controller/contact.controller"
import { RepairInformationController } from "./controller/repairInformation.controller"
import { FleekDriveController } from "./controller/fleekDrive.controller"

dotenv.config()

export default class App {
  constructor() {
    this.init()
  }

  async init() {
    console.log(`
    移行対象をご選択ください:
      1.共用部住戸カルテ
      2.コンタクト情報
      3.管理組合補修情報
      4.FleekDriveファイル
    `)

    const rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    // Enterを監視する
    rl.on("line", async str => {
      if (str === "1") {
        console.log("===共用部住戸カルテ移行開始===")
        await new CommonKarteInfoController().runBatch()
      } else if (str == "2") {
        console.log("===コンタクト情報移行開始===")
        await new ContactController().runBatch()
      } else if (str == "3") {
        console.log("===管理組合補修情報移行開始===")
        await new RepairInformationController().runBatch()
      } else if (str == "4") {
        console.log("===FleekDriveファイル移行開始===")
        await new FleekDriveController().runBatch()
      } else {
        await new testController().createTestFile3()
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

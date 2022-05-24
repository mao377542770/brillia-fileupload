import fs from "fs"
export class testController {
  // テストファイル作成
  async createTestFile() {
    const root = "C:\\SalesforceWorkSpace\\brillia_data\\eBrilliaFile\\"

    const fileList = [
      `000\\2175000\\fa7da290-6587-412f-9752-f1eb7a55c43f.pdf`,
      `001\\2175001\\7da3cc05-c240-4b24-ba72-688aefbf8b7c.pdf`,
      `002\\2175002\\c1f0913f-cb08-4811-9d23-8faf86d6c595.pdf`,
      `003\\2175003\\60e4dea9-88cb-4088-a8d8-76739e99c400.pdf`,
      `004\\2175004\\e629ba13-9e6e-45a6-9927-81ceb1d38246.pdf`,
      `005\\2175005\\92fb55bb-76ab-4af6-b283-0586e25480a6.pdf`,
      `006\\2175006\\58965c0e-88d9-426f-9f60-60c81c6e90be.pdf`,
      `007\\2175007\\8ff80c72-2a60-4d38-aa43-6e0b798a62ff.pdf`,
      `007\\289007\\5251d994-7882-4ae4-a45c-c06a7e4f66d5.pdf`,
      `008\\2175008\\6aaaa01a-8b06-410f-9cfd-147418083836.pdf`,
      `008\\289008\\4a4c9281-cb80-40a1-851e-ea6e1d818b61.pdf`,
      `009\\2175009\\ff752551-ad61-4202-baad-e62dcba6bcc2.pdf`,
      `009\\289009\\d7957978-af7b-4982-b2a9-4628218c2327.pdf`,
      `010\\2175010\\f8e516fd-debf-4a9c-8766-3fcd937e8d7e.pdf`
    ]

    const promiseList = []
    for (const fileStr of fileList) {
      const subStart = fileStr.lastIndexOf("\\")
      const folderPath = fileStr.substring(0, subStart)

      console.log(folderPath)

      promiseList.push(
        fs.mkdir(root + folderPath, { recursive: true }, err => {
          if (err) {
            console.log(err)
          }
          // ファイル作成
          fs.writeFileSync(root + fileStr, "test")
        })
      )

      await Promise.all(promiseList)
    }
  }

  async createTestFile2() {
    const root = "C:\\SalesforceWorkSpace\\brillia_data\\cBrilliaFile\\FileUpload\\"

    const fileList = [
      "?/58f02ac5-69ca-4022-bc44-b77b4174bc5f\\「ブリリアシティ千里津雲台」来客用駐車場案内図.pdf",
      "?/7c214a12-1d23-477a-9280-cd3a65d36713\\「ブリリアシティ千里津雲台」来客用駐車場案内図.pdf",
      "?/a2f68944-5b55-4559-ac15-24311c3449d8\\ゲストサロン案内図.pdf",
      "?/a213525d-9d8b-4c8c-9e16-ac4dd0f52d33\\20181005133333.pdf",
      "?/ef678ab6-a26e-4bfb-8ab6-407b962cf2e1\\招待状.pdf",
      "?/e811c727-9563-479a-9789-43a32b5de3b4\\ご招待状.pdf",
      "?/df5b2736-cbde-44f9-bd46-8639ead935c6\\マップ-MR-配置-0807＊.pdf",
      "?/b7530614-6c98-406e-bc5f-bf2ccb5857e7\\マップ-MR-配置-0807＊.pdf",
      "?/41ba155f-dede-4bfc-a0cc-c39bc89ef23a\\福原様招待状.pdf",
      "?/66d57e13-b757-444e-8252-2a6b590f63e3\\百崎様招待状.pdf",
      "?/8314cf24-70d1-4ef0-89c2-c13e558650db\\★予定価格表★.pdf?/fcccf92a-e78e-4193-a3b7-71e38546abe7\\★今後のスケジュール★.pdf?/296b2638-b1ef-49e8-8774-a47b06832a89\\★管理費等一覧★.pdf",
      "?/224894c4-b2b2-43a0-933d-820c3df57fd2\\ご招待状.pdf",
      "?/f5f0dc6c-6d0e-4371-b8ab-0254c3e903ae\\20181006192704木原様.pdf",
      "?/daabb693-939f-491e-92a0-534f8713b96e\\ご招待状.pdf",
      "?/6b93a89e-33e6-417d-930c-82ccedf316b0\\ゲストサロン案内図.pdf",
      "?/2bc84c76-020a-459e-b19a-9a562d07bc10\\招待状（田中様).pdf",
      "?/8d0c369a-7b2b-4ff2-a65a-e2e8ee7ce560\\伊藤様招待状.pdf",
      "?/7f67c5a0-4859-45db-bc2e-ce146b5b7096\\ご招待状.pdf",
      "?/f2b7a9fa-2124-4ab9-8f08-0b009b97494d\\提携駐車場のご案内.pdf",
      "?/688f3a21-e6ef-43f9-9fa1-5f99b007f2a3\\首藤様.pdf"
    ]

    const promiseList = []
    for (const mainStr of fileList) {
      // 先ず「?/」を[?\]に変更
      let fileStr = mainStr.replaceAll("?/", "?\\")
      const fileList = fileStr.split("?\\")
      for (const fileStr of fileList) {
        if (!fileStr) continue

        const subStart = fileStr.lastIndexOf("\\")
        const folderPath = fileStr.substring(0, subStart)

        console.log(folderPath)

        promiseList.push(
          fs.mkdir(root + folderPath, { recursive: true }, err => {
            if (err) {
              console.log(err)
            }
            // ファイル作成
            fs.writeFileSync(root + fileStr, "test")
          })
        )
      }
    }

    await Promise.all(promiseList)
  }

  async createTestFile3() {
    const root = "C:\\SalesforceWorkSpace\\brillia_data\\eBrilliaFile\\"

    const fileList = [
      "501\\3501\\インテリア(全体)_二子玉.pdf",
      "541\\3541\\パンフレット_MM.pdf",
      "542\\3542\\DM_小日向1丁目1.pdf",
      "542\\3542\\価格表_小日向1丁目3.pdf",
      "543\\3543\\アワード(MRオープン時)_H宮前平.pdf",
      "543\\3543\\用地取得会議_H宮前平.pdf",
      "543\\3543\\関係者確認会アンケ_H宮前平.pdf",
      "556\\3556\\鵠沼代理店提案資料.pdf",
      "834\\3834\\プラン変更追加重説(売価別).doc",
      "549\\3549\\2.外観パース.jpg",
      "048\\6048\\110818_詫訂-横堤_平詳-A3.pdf",
      "165\\3165\\ea7c5abf-7509-4a3e-a4b5-d57315aec72b.pdf"
    ]

    const promiseList = []
    for (const fileStr of fileList) {
      const subStart = fileStr.lastIndexOf("\\")
      const folderPath = fileStr.substring(0, subStart)

      console.log(folderPath)

      promiseList.push(
        fs.mkdir(root + folderPath, { recursive: true }, err => {
          if (err) {
            console.log(err)
          }
          // ファイル作成
          fs.writeFileSync(root + fileStr, "test")
        })
      )

      await Promise.all(promiseList)
    }
  }
}

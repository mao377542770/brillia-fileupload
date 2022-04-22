//管理組合補修情報
export interface RepairInformation {
  Id: string
  // 移行外部キー
  ExtId__c: string
  // 管理組合内部PID
  ManagementAssociation__c: string
  // プロジェクトコード
  Project__c: string
  // 棟コード
  Building__c: string
  // 部屋番号
  RoomNumber__c: string
  // 点検種別区分
  Kinds__c: string
  // 指摘№
  PointedOutNo__c: string
  file1: string
  file2: string
  file3: string
  file4: string
  file5: string
  SFDCId: string
  errorMsg: string
  hasError: 0 | 1 | undefined
}

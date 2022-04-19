export class Tools {
  /**
   * テキスト to Date
   * @param dateStr 時間フォーマットのテキスト 例:2020-01-15   or   2022/02/15
   * @returns Date
   */
  public static strToDate(dateStr: string | Date | null | undefined): Date | undefined {
    if (!dateStr) {
      return undefined
    }
    if (dateStr instanceof Date) {
      return dateStr
    }
    const exportDate = new Date(dateStr.replace(/-/g, "/"))
    const isInvalidDate = (date: Date) => Number.isNaN(date.getTime())
    if (isInvalidDate(exportDate)) {
      throw new Error(dateStr + "が有効な日付ではあまりせん")
    }
    return exportDate
  }

  /**
   * リストを指定の数で分割する
   * @param sourceList
   * @param size
   * @returns
   */
  public static chunk<T>(inputArray: T[], chunkSize: number) {
    let arr = []
    let len = inputArray.length
    for (let i = 0; i < len; i += chunkSize) {
      arr.push([...inputArray.slice(i, i + chunkSize)])
    }
    return arr
  }
}

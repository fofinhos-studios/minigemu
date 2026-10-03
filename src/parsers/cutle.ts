import type { CutleResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const HEADER_RE =
  /^Cutle\s+#([1-9]\d*)(?:\s+Best)?:\s*(([⬜🟥✅🎉])\uFE0F?\s+(\d{1,3}):(\d{1,3})\s+\3\uFE0F?)\s+\((\d{4}-\d{2}-\d{2})\)(?:\s*-\s*https?\\?:\/\/pfiffel\.com\/cutle\/?(?:\?\S*)?)?$/iu

export const cutleParser: GameParser = {
  gameType: "cutle",

  detect(lines: string[]): boolean {
    return /^Cutle\s+#/i.test(lines[0]?.trim() ?? "")
  },

  parse(lines: string[], _fallbackDate: string): ParseResult | null {
    const rawText = lines[0]?.trim() ?? ""
    const match = HEADER_RE.exec(rawText)
    if (!match) return null
    const gameNumber = Number(match[1])
    const left = Number(match[4])
    const right = Number(match[5])
    const date = match[6]!
    const parsedDate = new Date(`${date}T00:00:00Z`)
    if (
      !Number.isSafeInteger(gameNumber) ||
      left > 100 ||
      right > 100 ||
      left + right !== 100 ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return null
    }
    const score = Math.min(left, right)
    const emoji = score === 50 ? "🎉" : score >= 48 ? "✅" : score >= 45 ? "⬜" : "🟥"
    if (match[3] !== emoji) return null

    const result: CutleResult = {
      gameType: "cutle",
      date,
      gameNumber,
      ratio: [left, right],
      won: score >= 48,
      grid: [match[2]!],
      rawText,
    }
    return { result, consumedLines: 1 }
  },
}

import type { CrosstuneResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const HEADER_RE = /^Crosstune\s+#([1-9]\d*)\s+-\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i
const SOLVED_RE = /^I solved the puzzle in (\d+):([0-5]\d)( flawlessly)?\s+✅\uFE0F?\.$/i
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]

export const crosstuneParser: GameParser = {
  gameType: "crosstune",
  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },
  parse(lines: string[], fallbackDate: string): ParseResult | null {
    const header = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!header) return null
    const gameNumber = Number(header[1])
    if (!Number.isSafeInteger(gameNumber)) return null
    const month = MONTHS.indexOf(header[2]!.toLowerCase())
    const day = Number(header[3])
    const year = Number(fallbackDate.slice(0, 4))
    // Shares omit the year. Choose the valid date closest to the paste date,
    // including the adjacent years for shares pasted around New Year's Day.
    const reference = Date.parse(`${fallbackDate}T00:00:00Z`)
    const dates = [year - 1, year, year + 1]
      .map((candidate) => new Date(Date.UTC(candidate, month, day)))
      .filter((date) => month >= 0 && date.getUTCMonth() === month && date.getUTCDate() === day)
      .sort((a, b) => Math.abs(a.getTime() - reference) - Math.abs(b.getTime() - reference))
    if (!dates.length) return null

    let consumed = 1
    while (lines[consumed]?.trim() === "") consumed++
    const solved = SOLVED_RE.exec(lines[consumed]?.trim() ?? "")
    if (!solved) return null
    const timeSeconds = Number(solved[1]) * 60 + Number(solved[2])
    if (!Number.isSafeInteger(timeSeconds)) return null
    consumed++
    const afterResult = consumed
    while (lines[consumed]?.trim() === "") consumed++
    const link = lines[consumed]?.trim() ?? ""
    if (
      /^https:\/\/crosstune\.io\/s\/daily\/?$/i.test(link) ||
      /^\[https:\/\/crosstune\.io\/s\/daily\/?\]\(https:\/\/crosstune\.io\/s\/daily\/?\)$/i.test(
        link,
      )
    )
      consumed++
    else consumed = afterResult

    const result: CrosstuneResult = {
      gameType: "crosstune",
      date: dates[0]!.toISOString().slice(0, 10),
      won: true,
      gameNumber,
      timeSeconds,
      flawless: Boolean(solved[3]),
      grid: [],
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

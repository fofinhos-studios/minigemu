import type { AnthropeumResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const HEADER_RE = /^Anthropeum\.com\s*·\s*([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})$/i
const GRID_RE = /^(?:🟩|🟨|🟥|🟦){10}$/u
const SCORE_RE =
  /^(\d{1,6}|\d{1,3}(?:,\d{3})+|\d{1,3}(?:\.\d{3})+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:\s*·\s*top\s+(\d{1,3})% of players today!)?$/i

export const anthropeumParser: GameParser = {
  gameType: "anthropeum",

  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },

  parse(lines: string[], _fallbackDate: string): ParseResult | null {
    const header = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!header) return null

    const month = MONTHS.findIndex((name) => name.toLowerCase() === header[1]!.toLowerCase()) + 1
    const day = Number(header[2])
    const date = `${header[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const parsedDate = new Date(`${date}T00:00:00Z`)
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      return null
    }

    let consumed = 1
    while (lines[consumed]?.trim() === "") consumed++
    const row = lines[consumed]?.trim() ?? ""
    if (!GRID_RE.test(row)) return null
    consumed++
    while (lines[consumed]?.trim() === "") consumed++
    const scoreMatch = SCORE_RE.exec(lines[consumed]?.trim() ?? "")
    if (!scoreMatch) return null

    const score = Number(scoreMatch[1]!.replace(/[,. \u00a0\u202f]/g, ""))
    const topPercent = scoreMatch[2] === undefined ? undefined : Number(scoreMatch[2])
    if (score > 100_000 || (topPercent !== undefined && (topPercent < 1 || topPercent > 100))) {
      return null
    }
    consumed++

    const result: AnthropeumResult = {
      gameType: "anthropeum",
      date,
      won: true,
      score,
      ...(topPercent === undefined ? {} : { topPercent }),
      grid: [row],
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

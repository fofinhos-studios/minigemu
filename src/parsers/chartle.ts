import type { ChartleResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const HEADER_RE = /^(?:📈\uFE0F?\s*)?Chartle for (\d{1,2}) ([A-Za-z]{3}) (\d{4}):\s*(\S.*)$/i
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export const chartleParser: GameParser = {
  gameType: "chartle",
  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },
  parse(lines: string[], _fallbackDate: string): ParseResult | null {
    const header = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!header) return null
    const day = Number(header[1])
    const month = MONTHS.indexOf(header[2]!.toLowerCase())
    const year = Number(header[3])
    const date = new Date(`${header[3]}-01-01T00:00:00Z`)
    date.setUTCMonth(month, day)
    if (
      month < 0 ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month ||
      date.getUTCDate() !== day
    )
      return null

    let consumed = 1
    while (lines[consumed]?.trim() === "") consumed++
    const status = lines[consumed]?.trim() ?? ""
    const guessed = /^Guessed in ([1-5]) (?:try|tries)$/i.exec(status)
    if (!guessed && !/^Failed to guess this time$/i.test(status)) return null
    consumed++
    while (lines[consumed]?.trim() === "") consumed++
    const row = lines[consumed]?.trim() ?? ""
    const cells = row.replace(/\s|\uFE0F/g, "")
    if (Array.from(cells).length !== 5) return null
    const won = Boolean(guessed)
    if (won ? !/^🟥*✅⬜*$/u.test(cells) : !/^🟥+⬜*$/u.test(cells)) return null
    const attempts = Array.from(cells).filter((cell) => cell !== "⬜").length
    if (guessed && attempts !== Number(guessed[1])) return null
    consumed++

    const afterGrid = consumed
    while (lines[consumed]?.trim() === "") consumed++
    if (/^Play at https:\/\/chartle\.cc(?:[/?#]\S*)?$/i.test(lines[consumed]?.trim() ?? "")) {
      consumed++
    } else consumed = afterGrid

    const result: ChartleResult = {
      gameType: "chartle",
      date: date.toISOString().slice(0, 10),
      won,
      chartTitle: header[4]!,
      attempts,
      grid: [row],
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

import type { SpotleResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"
import { isEmojiLine } from "./utils"

const HEADER_RE = /^Spotle\.io\s+#([1-9]\d*)$/i
const CRITERIA = "📅👥📈🚻💽🌎"
const ROW_RE = /^[⬜⬛🟨🟩]{6}$/u
const normalize = (line: string) => line.replace(/\s|\uFE0F/g, "")

export const spotleParser: GameParser = {
  gameType: "spotle",

  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },

  parse(lines: string[], fallbackDate: string): ParseResult | null {
    const match = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!match) return null
    const gameNumber = Number(match[1])
    if (!Number.isSafeInteger(gameNumber)) return null

    let consumed = 1
    while (lines[consumed]?.trim() === "") consumed++
    const grid: string[] = []
    if (normalize(lines[consumed] ?? "") === CRITERIA) {
      grid.push(lines[consumed]!.trim())
      consumed++
    }

    const guesses: string[] = []
    while (consumed < lines.length) {
      const row = lines[consumed]!.trim()
      if (!row) {
        consumed++
        continue
      }
      const cells = normalize(row)
      if (!ROW_RE.test(cells)) {
        if (isEmojiLine(row)) return null
        break
      }
      if (guesses.length === 10 || guesses.at(-1) === "🟩".repeat(6)) return null
      guesses.push(cells)
      grid.push(row)
      consumed++
    }
    if (guesses.length === 0) return null

    if (/^https:\/\/spotle\.io(?:[/?#]|$)/i.test(lines[consumed]?.trim() ?? "")) {
      consumed++
    }

    const result: SpotleResult = {
      gameType: "spotle",
      date: fallbackDate,
      gameNumber,
      attempts: guesses.length,
      won: guesses.at(-1) === "🟩".repeat(6),
      grid,
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

import type { TimeGuessrResult, TimeGuessrRound } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const INTEGER = "(?:\\d{1,3}(?:,\\d{3})+|\\d+)"
const HEADER_RE = new RegExp(`^TimeGuessr #([1-9]\\d*)\\s*[—–-]\\s*(${INTEGER})/(${INTEGER})$`, "i")
const ROUND_RE = new RegExp(
  `^([1-5])\\uFE0F?\\u20E3\\s*🏆\\s*(${INTEGER})\\s*·\\s*📅\\s*(${INTEGER})y\\s*·\\s*🌍\\s*(${INTEGER}(?:\\.\\d+)?)\\s*(ft|mi|m|km)$`,
  "iu",
)
const LINK_RE = /^https:\/\/timeguessr\.com\/?$/i
const number = (value: string) => Number(value.replaceAll(",", ""))

export const timeGuessrParser: GameParser = {
  gameType: "timeguessr",

  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },

  parse(lines: string[], fallbackDate: string): ParseResult | null {
    const header = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!header) return null
    const gameNumber = Number(header[1])
    const score = number(header[2]!)
    if (!Number.isSafeInteger(gameNumber) || score > 50_000 || number(header[3]!) !== 50_000) {
      return null
    }

    let consumed = 1
    const grid: string[] = []
    const rounds: TimeGuessrRound[] = []
    for (let round = 1; round <= 5; round++) {
      while (lines[consumed]?.trim() === "") consumed++
      const row = lines[consumed]?.trim() ?? ""
      const match = ROUND_RE.exec(row)
      if (!match || Number(match[1]) !== round) return null
      const points = number(match[2]!)
      const yearError = number(match[3]!)
      const distance = number(match[4]!)
      if (points > 10_000 || !Number.isSafeInteger(yearError) || !Number.isFinite(distance)) {
        return null
      }
      rounds.push({
        score: points,
        yearError,
        distance,
        distanceUnit: match[5]!.toLowerCase() as TimeGuessrRound["distanceUnit"],
      })
      grid.push(row)
      consumed++
    }
    if (rounds.reduce((total, round) => total + round.score, 0) !== score) return null

    const afterRounds = consumed
    while (lines[consumed]?.trim() === "") consumed++
    if (/^\d+\uFE0F?\u20E3/u.test(lines[consumed]?.trim() ?? "")) return null
    if (LINK_RE.test(lines[consumed]?.trim() ?? "")) consumed++
    else consumed = afterRounds

    const result: TimeGuessrResult = {
      gameType: "timeguessr",
      date: fallbackDate,
      won: true,
      gameNumber,
      score,
      rounds,
      grid,
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

import { todayKey } from "@/lib/dates"
import type { GameResult } from "@/types/games"
import { anthropeumParser } from "./anthropeum"
import { conexoParser } from "./conexo"
import { cutleParser } from "./cutle"
import { expressoParser } from "./expresso"
import { framedParser } from "./framed"
import { gamedleParser } from "./gamedle"
import { guessTheGameParser } from "./guessthegame"
import { krillionParser } from "./krillion"
import { letrosoParser } from "./letroso"
import { sizeItUpParser } from "./sizeitup"
import { termoParser } from "./termo"
import { timeGuessrParser } from "./timeguessr"
import type { GameParser } from "./types"

const parsers: GameParser[] = [
  anthropeumParser,
  conexoParser,
  cutleParser,
  expressoParser,
  framedParser,
  gamedleParser,
  guessTheGameParser,
  krillionParser,
  letrosoParser,
  sizeItUpParser,
  termoParser,
  timeGuessrParser,
]

export function parseInput(text: string | undefined): GameResult[] {
  if (!text) return []
  const lines = text.split("\n")
  const results: GameResult[] = []
  const fallbackDate = todayKey()

  let i = 0
  while (i < lines.length) {
    const line = lines[i]!.trim()

    // Skip blank lines
    if (line === "") {
      i++
      continue
    }

    // Try each parser against the remaining lines
    const remaining = lines.slice(i)
    let matched = false

    for (const parser of parsers) {
      if (parser.detect(remaining)) {
        const result = parser.parse(remaining, fallbackDate)
        if (result) {
          results.push(result.result)
          i += result.consumedLines
          matched = true
          break
        }
      }
    }

    // If no parser matched, skip this line
    if (!matched) {
      i++
    }
  }

  return results
}

export { parsers }

import type { ZoomOutResult } from "@/types/games"
import type { GameParser, ParseResult } from "./types"

const HEADER_RE = /^(?:🔎\uFE0F?\s*)?ZoomOut\s+(\d{4}-\d{2}-\d{2}):\s*(.+)$/iu
const URL_RE = /^https?\\?:\/\/zoomout\.videoludid\.com(?:[/?#]\S*)?(?:\s+#ZoomOut)?$/i

export const zoomOutParser: GameParser = {
  gameType: "zoomout",

  detect(lines: string[]): boolean {
    return HEADER_RE.test(lines[0]?.trim() ?? "")
  },

  parse(lines: string[], _fallbackDate: string): ParseResult | null {
    const match = HEADER_RE.exec(lines[0]?.trim() ?? "")
    if (!match) return null

    const date = match[1]!
    const timestamp = Date.parse(`${date}T00:00:00Z`)
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
      return null
    }

    const gridMatch = /^((?:[🟥🟧🟩⬛]\uFE0F?\s*){5})(.*)$/u.exec(match[2]!)
    if (!gridMatch || /[🟥🟧🟩⬛]/u.test(gridMatch[2]!)) return null
    const row = gridMatch[1]!.replace(/\s|\uFE0F/g, "")
    // Orange means the right franchise, not the exact game. Black cells are unused guesses.
    if (!/^(?:🟥|🟧)+(?:⬛)*$|^(?:🟥|🟧)*🟩(?:⬛)*$/u.test(row)) return null

    const won = row.includes("🟩")
    const attempts = Array.from(row).filter((cell) => cell !== "⬛").length
    let consumed = 1
    if (/^My guesses: \|\|.*\|\|$/.test(lines[consumed]?.trim() ?? "")) consumed++
    let urlIndex = consumed
    while (lines[urlIndex]?.trim() === "") urlIndex++
    if (URL_RE.test(lines[urlIndex]?.trim() ?? "")) consumed = urlIndex + 1

    const result: ZoomOutResult = {
      gameType: "zoomout",
      date,
      won,
      attempts,
      grid: [row],
      rawText: lines.slice(0, consumed).join("\n").trim(),
    }
    return { result, consumedLines: consumed }
  },
}

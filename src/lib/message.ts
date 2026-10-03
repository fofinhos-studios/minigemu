import { formatDateBR } from "@/lib/dates"
import { formatKrillionGrid } from "@/lib/krillion"
import type { DayEntry } from "@/types/games"
import { GAME_LABELS, GAME_ORDER } from "@/types/games"

interface ShareMessageOptions {
  gameNamesOnly?: boolean
}

export function generateShareMessage(entry: DayEntry, options: ShareMessageOptions = {}): string {
  const dateLine = `ミニゲーム (Minigēmu) - ${formatDateBR(entry.date)}`

  // Sort results by canonical game order
  const sorted = [...entry.results].sort((a, b) => {
    return GAME_ORDER.indexOf(a.gameType) - GAME_ORDER.indexOf(b.gameType)
  })

  const blocks = sorted.map((r) => {
    if (r.gameType === "krillion" && r.won) {
      const header = options.gameNamesOnly ? "Krillion" : r.rawText.split("\n")[0]!.trim()
      return [header, ...formatKrillionGrid(r.tiers)].join("\n")
    }

    if (options.gameNamesOnly) {
      if (!r.won && r.rawText === `${GAME_LABELS[r.gameType]} ❌`) return r.rawText
      if (r.gameType === "anthropeum") {
        return [GAME_LABELS[r.gameType], ...r.grid, r.rawText.split(/\r?\n/).at(-1)!.trim()].join(
          "\n",
        )
      }
      if (r.gameType === "timeguessr") {
        return [
          `${GAME_LABELS[r.gameType]} — ${r.score.toLocaleString("en-US")}/50,000`,
          ...r.grid,
        ].join("\n")
      }
      if (r.gameType === "sizeitup") {
        return [GAME_LABELS[r.gameType], `Overall Score ${r.overallScore}`, ...r.grid].join("\n")
      }
      return [GAME_LABELS[r.gameType], ...r.grid].join("\n")
    }

    if (r.gameType === "cutle") {
      return r.rawText.replace(/\s*-\s*https?\\?:\/\/\S+$/i, "").trim()
    }

    if (r.gameType === "zoomout") {
      return r.rawText
        .replace(
          /^https?\\?:\/\/zoomout\.videoludid\.com(?:[/?#]\S*)?(?:[ \t]+#ZoomOut)?[ \t]*\r?$/gm,
          "",
        )
        .trim()
    }

    return r.rawText
      .replace(/\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)/g, "")
      .replace(/\s*>\s*https?:\/\/\S+/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  })
  return [dateLine, "", ...blocks.join("\n\n").split("\n")].join("\n")
}

import { GAME_LABELS, type GameResult, type TermoMode } from "@/types/games"

export type GridToken = {
  text: string
  color?: string
  shape?: "square" | "circle"
  symbol?: "check" | "cross" | "hint" | "camera" | "game" | "joystick"
}
const cells: Record<string, Pick<GridToken, "color" | "shape" | "symbol">> = {
  "🟩": { color: "green" },
  "🟨": { color: "yellow" },
  "🟥": { color: "red" },
  "🟦": { color: "blue" },
  "🟪": { color: "purple" },
  "🟧": { color: "orange" },
  "⬛": { color: "black" },
  "⬜": { color: "white" },
  "🟢": { color: "green", shape: "circle" },
  "🟡": { color: "yellow", shape: "circle" },
  "🔴": { color: "red", shape: "circle" },
  "🔵": { color: "blue", shape: "circle" },
  "✅": { color: "green", symbol: "check" },
  "❌": { color: "red", symbol: "cross" },
  "🎥": { color: "white", symbol: "camera" },
  "🎬": { color: "white", symbol: "camera" },
  "🎮": { color: "white", symbol: "game" },
  "🕹": { color: "white", symbol: "joystick" },
  "💡": { color: "yellow", symbol: "hint" },
}
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

export function tokenizeGrid(row: string): GridToken[] {
  const tokens: GridToken[] = []
  for (const { segment } of segmenter.segment(row)) {
    const cell = cells[segment.replace(/\uFE0F/g, "")]
    const previous = tokens.at(-1)
    if (!cell && previous && !previous.color) previous.text += segment
    else tokens.push({ text: segment, ...cell })
  }
  return tokens
}
export function isManualLoss(result: GameResult): boolean {
  return !result.won && result.rawText === `${GAME_LABELS[result.gameType]} ❌`
}
// Metadata is a view of stored results. Never infer wins or invent missing numbers.
export interface ResultMetric {
  value: number | string
  label: "attempts" | "points" | "topPlayers" | "manual" | "ratio"
  mode?: string
}

function gridAttempts(rows: string[]): number | string {
  const attempts = rows
    .flatMap(tokenizeGrid)
    .filter((token) => ["🟥", "🟨", "🟩"].includes(token.text.replace(/\uFE0F/g, ""))).length
  return attempts || "—"
}

function termoAttempts(mode: TermoMode): number | string {
  if (mode.attempts) return mode.attempts
  const boards = [...mode.grid.join(" ").matchAll(/(\d)\uFE0F?\u20E3/g)]
  if (boards.length) return boards.map((match) => match[1]).join(" · ")
  return mode.grid.filter((row) => /[🟩🟨⬛⬜]/u.test(row)).length || "—"
}

export function resultMetrics(result: GameResult): ResultMetric[] {
  if (isManualLoss(result)) return [{ value: "—", label: "manual" }]
  switch (result.gameType) {
    case "anthropeum":
      return [
        { value: result.score, label: "points" },
        ...(result.topPercent === undefined
          ? []
          : [{ value: `${result.topPercent}%`, label: "topPlayers" as const }]),
      ]
    case "cutle":
      return [{ value: result.ratio.join(":"), label: "ratio" }]
    case "conexo":
    case "expresso":
    case "letroso":
    case "zoomout":
      return [{ value: result.attempts > 0 ? result.attempts : "—", label: "attempts" }]
    case "framed":
    case "guessthegame":
      return [{ value: gridAttempts(result.grid), label: "attempts" }]
    case "timeguessr":
      return [{ value: `${result.score.toLocaleString("en-US")} / 50,000`, label: "points" }]
    case "krillion":
      return [{ value: result.score, label: "points" }]
    case "sizeitup":
      return [{ value: result.overallScore, label: "points" }]
    case "gamedle":
      return result.modes.length
        ? result.modes.map((mode) => ({
            mode: mode.mode,
            value: gridAttempts([mode.grid]),
            label: "attempts",
          }))
        : [{ value: "—", label: "attempts" }]
    case "termo":
      return result.modes.length
        ? result.modes.map((mode) => ({
            mode: mode.mode,
            value: termoAttempts(mode),
            label: "attempts",
          }))
        : [{ value: "—", label: "attempts" }]
  }
}

export function resultEditions(result: GameResult): { mode?: string; value: string }[] {
  if (isManualLoss(result)) return []
  if (result.gameType === "gamedle" || result.gameType === "termo") {
    return result.modes
      .filter((mode) => mode.gameNumber > 0)
      .map((mode) => ({ mode: mode.mode, value: `#${mode.gameNumber}` }))
  }
  return "gameNumber" in result && result.gameNumber > 0 ? [{ value: `#${result.gameNumber}` }] : []
}

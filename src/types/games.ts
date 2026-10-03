import type { KrillionTier } from "@/lib/krillion"

export type GameType =
  | "anthropeum"
  | "conexo"
  | "cutle"
  | "expresso"
  | "framed"
  | "gamedle"
  | "guessthegame"
  | "krillion"
  | "letroso"
  | "sizeitup"
  | "termo"
  | "timeguessr"
  | "zoomout"

export const GAME_LABELS: Record<GameType, string> = {
  anthropeum: "Anthropeum",
  conexo: "Conexo",
  cutle: "Cutle",
  expresso: "Expresso",
  framed: "Framed",
  gamedle: "Gamedle",
  guessthegame: "GuessTheGame",
  krillion: "Krillion",
  letroso: "Letroso",
  sizeitup: "Size It Up",
  termo: "Termo",
  timeguessr: "TimeGuessr",
  zoomout: "ZoomOut",
}

export const GAME_INFO: Record<
  GameType,
  { label: string; url: string; favicon: string; emoji: string }
> = {
  anthropeum: {
    label: "Anthropeum",
    url: "https://anthropeum.com/",
    favicon: "/favicons/anthropeum.ico",
    emoji: "🏺",
  },
  conexo: {
    label: "Conexo",
    url: "https://conexo.ws",
    favicon: "/favicons/conexo.ico",
    emoji: "🔗",
  },
  cutle: {
    label: "Cutle",
    url: "https://pfiffel.com/cutle/",
    favicon: "/favicons/cutle.png",
    emoji: "✂️",
  },
  expresso: {
    label: "Expresso",
    url: "https://expresso.ac",
    favicon: "/favicons/expresso.ico",
    emoji: "💬",
  },
  framed: {
    label: "Framed",
    url: "https://framed.wtf",
    favicon: "/favicons/framed.ico",
    emoji: "🎬",
  },
  gamedle: {
    label: "Gamedle",
    url: "https://gamedle.wtf",
    favicon: "/favicons/gamedle.ico",
    emoji: "🕹️",
  },
  guessthegame: {
    label: "GuessTheGame",
    url: "https://guessthe.game",
    favicon: "/favicons/guessthegame.ico",
    emoji: "🎮",
  },
  krillion: {
    label: "Krillion",
    url: "https://krillion.io",
    favicon: "/favicons/krillion.png",
    emoji: "🦐",
  },
  letroso: {
    label: "Letroso",
    url: "https://letroso.com",
    favicon: "/favicons/letroso.ico",
    emoji: "🔤",
  },
  sizeitup: {
    label: "Size It Up",
    url: "https://magnitudle.com/size-it-up",
    favicon: "/favicons/sizeitup.png",
    emoji: "📏",
  },
  timeguessr: {
    label: "TimeGuessr",
    url: "https://timeguessr.com/",
    favicon: "/favicons/timeguessr.ico",
    emoji: "🌍",
  },
  termo: {
    label: "Termo",
    url: "https://term.ooo",
    favicon: "/favicons/termo.ico",
    emoji: "🟩",
  },
  zoomout: {
    label: "ZoomOut",
    url: "https://zoomout.videoludid.com/",
    favicon: "/favicons/zoomout.png",
    emoji: "🔎",
  },
}

export const GAME_ORDER: GameType[] = [
  "anthropeum",
  "conexo",
  "cutle",
  "expresso",
  "framed",
  "gamedle",
  "guessthegame",
  "krillion",
  "letroso",
  "sizeitup",
  "termo",
  "timeguessr",
  "zoomout",
]

export interface BaseResult {
  gameType: GameType
  date: string
  won: boolean
  grid: string[]
  rawText: string
}

export interface AnthropeumResult extends BaseResult {
  gameType: "anthropeum"
  score: number
  topPercent?: number
}

export interface ConexoResult extends BaseResult {
  gameType: "conexo"
  attempts: number
  hints: number
}

export interface CutleResult extends BaseResult {
  gameType: "cutle"
  gameNumber: number
  ratio: [number, number]
}

export interface FramedResult extends BaseResult {
  gameType: "framed"
  gameNumber: number
}

export interface ExpressoResult extends BaseResult {
  gameType: "expresso"
  attempts: number
}

export interface GamedleMode {
  mode: string
  emoji: string
  gameNumber: number
  grid: string
  won: boolean
}

export interface GamedleResult extends BaseResult {
  gameType: "gamedle"
  modes: GamedleMode[]
}

export interface GuessTheGameResult extends BaseResult {
  gameType: "guessthegame"
  gameNumber: number
}

export interface KrillionResult extends BaseResult {
  gameType: "krillion"
  gameNumber: number
  score: number
  tiers: KrillionTier[]
}

export interface LetrosoResult extends BaseResult {
  gameType: "letroso"
  attempts: number
}

export interface SizeItUpResult extends BaseResult {
  gameType: "sizeitup"
  overallScore: number
  roundScores: number[]
}

export interface TimeGuessrRound {
  score: number
  yearError: number
  distance: number
  distanceUnit: "ft" | "mi" | "m" | "km"
}

export interface TimeGuessrResult extends BaseResult {
  gameType: "timeguessr"
  gameNumber: number
  score: number
  rounds: TimeGuessrRound[]
}

export interface ZoomOutResult extends BaseResult {
  gameType: "zoomout"
  attempts: number
}

export interface TermoMode {
  mode: string
  gameNumber: number
  streak: number
  grid: string[]
  attempts: string
}

export interface TermoResult extends BaseResult {
  gameType: "termo"
  modes: TermoMode[]
}

export type GameResult =
  | AnthropeumResult
  | ConexoResult
  | CutleResult
  | ExpressoResult
  | FramedResult
  | GamedleResult
  | GuessTheGameResult
  | KrillionResult
  | LetrosoResult
  | SizeItUpResult
  | TermoResult
  | TimeGuessrResult
  | ZoomOutResult

export interface DayEntry {
  date: string
  results: GameResult[]
}

export interface AppData {
  version: number
  entries: Record<string, DayEntry>
}

export function createEmptyAppData(): AppData {
  return { version: 1, entries: {} }
}

export function createManualLoss(gameType: GameType, date: string): GameResult {
  const base = {
    gameType,
    date,
    won: false,
    grid: ["❌"],
    rawText: `${GAME_LABELS[gameType]} ❌`,
  }

  switch (gameType) {
    case "anthropeum":
      return { ...base, gameType, score: 0 }
    case "cutle":
      return { ...base, gameType, gameNumber: 0, ratio: [0, 0] }
    case "conexo":
      return { ...base, gameType, attempts: 0, hints: 0 }
    case "expresso":
    case "letroso":
    case "zoomout":
      return { ...base, gameType, attempts: 0 }
    case "framed":
    case "guessthegame":
      return { ...base, gameType, gameNumber: 0 }
    case "krillion":
      return { ...base, gameType, gameNumber: 0, score: 0, tiers: [] }
    case "timeguessr":
      return { ...base, gameType, gameNumber: 0, score: 0, rounds: [] }
    case "sizeitup":
      return { ...base, gameType, overallScore: 0, roundScores: [] }
    case "gamedle":
    case "termo":
      return { ...base, gameType, modes: [] }
  }
}

// Sub-game support: "gameType" or "gameType:mode"
export type SubGameKey = string

export function getSubGameEntries(result: GameResult): { key: SubGameKey; won: boolean }[] {
  if (result.gameType === "gamedle") {
    if (result.modes.length === 0) return [{ key: result.gameType, won: result.won }]
    return result.modes.map((m) => ({
      key: `gamedle:${m.mode}`,
      won: m.won,
    }))
  }
  if (result.gameType === "termo") {
    if (result.modes.length === 0) return [{ key: result.gameType, won: result.won }]
    return result.modes.map((m) => {
      const won = m.grid.some((row) => {
        const greens = Array.from(row).filter((c) => c === "🟩").length
        return greens >= 5
      })
      return { key: `termo:${m.mode}`, won }
    })
  }
  return [{ key: result.gameType, won: result.won }]
}

export function parseSubGameKey(key: SubGameKey): { gameType: GameType; mode?: string } {
  const idx = key.indexOf(":")
  if (idx === -1) return { gameType: key as GameType }
  return { gameType: key.slice(0, idx) as GameType, mode: key.slice(idx + 1) }
}

export function getSubGameLabel(key: SubGameKey): string {
  const { gameType, mode } = parseSubGameKey(key)
  const base = GAME_LABELS[gameType]
  return mode ? `${base} - ${mode.charAt(0).toUpperCase() + mode.slice(1)}` : base
}

import type { CSSProperties } from "react"
import { GAME_INFO, type GameType } from "@/types/games"

export interface GameVisual {
  code: string
  favicon: string
  color: `var(--game-${GameType})`
  ink: `var(--game-${GameType}-ink)`
}

const identity = (game: GameType, code: string): GameVisual => ({
  code,
  favicon: GAME_INFO[game].favicon,
  color: `var(--game-${game})`,
  ink: `var(--game-${game}-ink)`,
})
export const GAME_VISUALS: Record<GameType, GameVisual> = {
  anthropeum: identity("anthropeum", "ANT"),
  conexo: identity("conexo", "CNX"),
  cutle: identity("cutle", "CUT"),
  expresso: identity("expresso", "EXP"),
  framed: identity("framed", "FRM"),
  gamedle: identity("gamedle", "GMD"),
  guessthegame: identity("guessthegame", "GTG"),
  krillion: identity("krillion", "KRL"),
  letroso: identity("letroso", "LTR"),
  sizeitup: identity("sizeitup", "SIZ"),
  termo: identity("termo", "TRM"),
  timeguessr: identity("timeguessr", "TGS"),
}

export function gameStyle(game: GameType): CSSProperties {
  const visual = GAME_VISUALS[game]
  return { "--game-color": visual.color, "--game-ink": visual.ink } as CSSProperties
}

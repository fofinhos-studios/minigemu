import { parseInput } from "@/parsers"
import type { GameResult } from "@/types/games"
import anthropeum from "../../samples/anthropeum.txt?raw"
import conexo from "../../samples/conexo.txt?raw"
import cutle from "../../samples/cutle.txt?raw"
import expresso from "../../samples/expresso.txt?raw"
import framed from "../../samples/framed.txt?raw"
import gamedle from "../../samples/gamedle.txt?raw"
import guess from "../../samples/guessthegame.txt?raw"
import letroso from "../../samples/letroso.txt?raw"
import termo from "../../samples/termo.txt?raw"

export const DEMO_DATE = "2026-09-26"
const sources = [
  anthropeum,
  conexo,
  cutle,
  expresso,
  framed,
  gamedle,
  guess,
  letroso,
  termo,
  "Krillion #73 🦐\n300\n⬛🫧🤡🐟🦑🏮🌟",
  "Size It Up\nOverall Score 350\n🟥🟥🟥🟥🟥 100\n🟥🟥🟥🟥⬜ 80\n🟥🟥🟥⬜⬜ 70\n🟥🟥🟥⬜⬜ 60\n🟥🟥⬜⬜⬜ 40",
]
// Development-only fixture data. Never imported by the production App.
export const demoResults: GameResult[] = sources
  .flatMap((text) =>
    parseInput(text.split(/\r?\n---/)[0]!.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, "26/09/2026")).slice(
      0,
      1,
    ),
  )
  .map((result) => ({ ...result, date: DEMO_DATE }))

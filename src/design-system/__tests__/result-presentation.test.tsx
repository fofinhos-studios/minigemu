import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { GameResultCard } from "@/components/summary/GameResultCard"
import { ResultGrid } from "@/components/summary/ResultGrid"
import { I18nProvider } from "@/i18n/I18nProvider"
import { generateShareMessage } from "@/lib/message"
import { parseInput } from "@/parsers"
import { createManualLoss, GAME_ORDER, type GameResult } from "@/types/games"
import { resultEditions, resultMetrics, tokenizeGrid } from "../result-presentation"

const fixture = (name: string) =>
  readFileSync(new URL(`../../../samples/${name}.txt`, import.meta.url), "utf8")
const samples = [
  "anthropeum",
  "conexo",
  "cutle",
  "expresso",
  "framed",
  "gamedle",
  "guessthegame",
  "letroso",
  "termo",
].flatMap((name) => parseInput(fixture(name)).slice(0, 1))
samples.push(...parseInput("Krillion #4 🦐\n300\n⬛🫧🤡🐟🦑🏮🌟"))
samples.push(
  ...parseInput(
    "Size It Up\nOverall Score 350\n🟥🟥🟥🟥🟥 100\n🟥🟥🟥🟥⬜ 80\n🟥🟥🟥⬜⬜ 70\n🟥🟥🟥⬜⬜ 60\n🟥🟥⬜⬜⬜ 40",
  ),
)
const render = (result: GameResult) =>
  renderToStaticMarkup(
    <I18nProvider persistent={false}>
      <GameResultCard result={result} onRemove={() => {}} />
    </I18nProvider>,
  )

describe("graphical results preserve gameplay information", () => {
  test("keeps complete graphemes, keycaps, unknown symbols and exact spaces", () => {
    const row = "🟩⬛  🟢 4️⃣6️⃣ 👨‍👩‍👧‍👦 Çãé ❔ ✅️"
    const tokens = tokenizeGrid(row)
    expect(tokens.map((token) => token.text).join("")).toBe(row)
    expect(tokens[0]?.color).toBe("green")
    expect(tokens.find((token) => token.text === "🟢")?.shape).toBe("circle")
    expect(tokens.at(-1)?.symbol).toBe("check")
  })
  test("renders all supported games without modifying stored results or shared text", () => {
    expect(new Set(samples.map((result) => result.gameType)).size).toBe(GAME_ORDER.length)
    for (const result of samples) {
      const before = JSON.stringify(result)
      const entry = { date: result.date, results: [result] }
      const message = generateShareMessage(entry)
      const html = render(result)
      expect(html).toContain("ticket-stub")
      expect(html).not.toContain("<time")
      expect(JSON.stringify(result)).toBe(before)
      expect(generateShareMessage(entry)).toBe(message)
    }
  })
  test("does not display sentinel editions or scores for any manual loss", () => {
    for (const game of GAME_ORDER) {
      const result = createManualLoss(game, "2026-09-26")
      expect(resultMetrics(result)).toEqual([{ value: "—", label: "manual" }])
      expect(resultEditions(result)).toEqual([])
      expect(render(result)).toContain("Derrota manual")
    }
  })
  test("retains zero-point completed games as a real score", () => {
    const result = parseInput("Krillion #4 🦐\n0\n⬛⬛⬛⬛⬛⬛⬛")[0]!
    expect(resultMetrics(result)).toEqual([{ value: 0, label: "points" }])
    expect(render(result)).toContain("Concluído")
  })
  test("keeps all modes and side-by-side Termo boards", () => {
    const result: GameResult = {
      ...createManualLoss("termo", "2026-09-26"),
      gameType: "termo",
      won: true,
      rawText: "term.ooo/2",
      modes: [
        {
          mode: "duet",
          gameNumber: 1251,
          streak: 1,
          attempts: "4/7",
          grid: ["4️⃣6️⃣", "🟩🟩🟩🟩🟩  ⬛🟨⬛⬛🟩"],
        },
      ],
    }
    const html = renderToStaticMarkup(
      <I18nProvider persistent={false}>
        <ResultGrid result={result} />
      </I18nProvider>,
    )
    expect(html).toContain("duet")
    expect(resultEditions(result)).toEqual([{ mode: "duet", value: "#1251" }])
    expect(resultMetrics(result)).toEqual([{ mode: "duet", value: "4/7", label: "attempts" }])
    expect(html).not.toContain("#1251")
    expect(html).toContain("4️⃣6️⃣")
    expect(html.match(/class="result-cell"/g)?.length).toBe(10)
    expect(html).toContain("<span>  </span>")
  })
  test("renders all Gamedle modes and seven Krillion tiers", () => {
    const gamedle = samples.find((result) => result.gameType === "gamedle")!
    if (gamedle.gameType !== "gamedle") throw new Error("fixture")
    const html = render(gamedle)
    for (const mode of gamedle.modes) expect(html).toContain(mode.mode)
    expect(
      render(samples.find((result) => result.gameType === "krillion")!).match(
        /class="result-round"/g,
      )?.length,
    ).toBe(7)
    expect(
      render(samples.find((result) => result.gameType === "sizeitup")!).match(
        /class="result-round"/g,
      )?.length,
    ).toBe(5)
  })
  test("shows only available editions in the stub, without card dates or placeholders", () => {
    for (const result of samples) {
      const html = render(result)
      const bodyStart = html.indexOf('class="ticket-body"')
      const stub = html.slice(0, bodyStart)
      const body = html.slice(bodyStart)
      expect(body).toContain('class="ticket-performance"')
      expect(html).not.toContain("<time")
      expect(html).not.toContain(result.date)
      expect(stub).not.toContain("—")
      expect(stub.includes("Edição")).toBe(resultEditions(result).length > 0)
      for (const edition of resultEditions(result)) {
        expect(stub).toContain(edition.value)
        expect(body).not.toContain(edition.value)
      }
      expect(
        resultMetrics(result).every((metric) =>
          ["topPlayers", "attempts", "ratio", "points"].includes(metric.label),
        ),
      ).toBe(true)
    }
  })
  test("omits unknown editions without dropping the other modes", () => {
    const result = samples.find((item) => item.gameType === "gamedle")!
    if (result.gameType !== "gamedle") throw new Error("fixture")
    const modes = result.modes
      .slice(0, 2)
      .map((mode, index) => ({ ...mode, gameNumber: index === 0 ? 0 : 1136 }))
    expect(resultEditions({ ...result, modes })).toEqual([{ mode: modes[1]!.mode, value: "#1136" }])
    expect(resultEditions({ ...result, modes: [] })).toEqual([])
  })
  test("counts only played guesses, independently of edition and unused cells", () => {
    const framed = samples.find((result) => result.gameType === "framed")!
    for (const gameType of ["framed", "guessthegame"] as const) {
      const base = { ...framed, gameType, gameNumber: 818 }
      for (const [grid, expected] of [
        ["🎥 🟥 🟩 ⬜ ⬜ ⬜ ⬜", 2],
        ["🎮 🟥 🟥 🟥 🟥 🟥 🟥", 6],
        ["🎮 🟥 🟥 ⬜ ⬜ ⬜ ⬜", 2],
        ["🎮 ⬜ ⬜ ❔", "—"],
      ] as const) {
        expect(resultMetrics({ ...base, grid: [grid] })).toEqual([
          { value: expected, label: "attempts" },
        ])
        expect(resultEditions(base)).toEqual([{ value: "#818" }])
      }
    }
    const gamedle = parseInput(fixture("gamedle").split("---")[0]!)[0]!
    expect(resultMetrics(gamedle).map((metric) => metric.value)).toEqual([2, 6, 4, 6])
    expect(resultEditions(gamedle).map((edition) => edition.value)).toEqual([
      "#1377",
      "#1136",
      "#229",
      "#936",
    ])
  })
  test("uses stored Termo attempts, board keycaps or played rows without inventing a score", () => {
    const result = samples.find((item) => item.gameType === "termo")!
    if (result.gameType !== "termo") throw new Error("fixture")
    const mode = result.modes[0]!
    const modes = [
      { ...mode, attempts: "4/6", grid: ["🟩🟩🟩🟩🟩"] },
      { ...mode, attempts: "", grid: ["4️⃣6️⃣"] },
      { ...mode, attempts: "", grid: ["⬛🟨⬛⬛🟩", "🟩🟩🟩🟩🟩"] },
      { ...mode, attempts: "", grid: [] },
    ]
    expect(resultMetrics({ ...result, modes }).map((metric) => metric.value)).toEqual([
      "4/6",
      "4 · 6",
      2,
      "—",
    ])
  })
})

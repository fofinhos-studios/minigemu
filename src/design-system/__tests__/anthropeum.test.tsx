import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { GameResultCard } from "@/components/summary/GameResultCard"
import { I18nProvider } from "@/i18n/I18nProvider"
import { parseInput } from "@/parsers"
import { resultEditions, resultMetrics } from "../result-presentation"

const example = readFileSync(
  new URL("../../../samples/anthropeum.txt", import.meta.url),
  "utf8",
).trim()

test("shows Anthropeum points, optional rank and all ten rounds without changing the result", () => {
  const result = parseInput(example)[0]!
  const before = JSON.stringify(result)
  expect(resultMetrics(result)).toEqual([
    { value: 51973, label: "points" },
    { value: "94%", label: "topPlayers" },
  ])
  expect(resultEditions(result)).toEqual([])
  const html = renderToStaticMarkup(
    <I18nProvider persistent={false}>
      <GameResultCard result={result} onRemove={() => {}} />
    </I18nProvider>,
  )
  expect(html).toContain("51973")
  expect(html).toContain("94%")
  expect(html).toContain("Top dos jogadores")
  expect(html).toContain("Concluído")
  expect(html.match(/class="result-cell"/g)).toHaveLength(10)
  expect(JSON.stringify(result)).toBe(before)

  const unranked = parseInput(example.replace(" · top 94% of players today!", ""))[0]!
  expect(resultMetrics(unranked)).toEqual([{ value: 51973, label: "points" }])
})

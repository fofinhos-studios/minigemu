import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { GameResultCard } from "@/components/summary/GameResultCard"
import { I18nProvider } from "@/i18n/I18nProvider"
import { parseInput } from "@/parsers"
import { resultEditions, resultMetrics } from "../result-presentation"

test("shows TimeGuessr total, edition and five rounds without mutating the stored result", () => {
  const result = parseInput(
    readFileSync(new URL("../../../samples/timeguessr.txt", import.meta.url), "utf8"),
  )[0]!
  const before = JSON.stringify(result)
  expect(resultMetrics(result)).toEqual([{ value: "34,395 / 50,000", label: "points" }])
  expect(resultEditions(result)).toEqual([{ value: "#1221" }])
  const html = renderToStaticMarkup(
    <I18nProvider persistent={false}>
      <GameResultCard result={result} onRemove={() => {}} />
    </I18nProvider>,
  )
  expect(html.match(/class="result-round flex-wrap"/g)).toHaveLength(5)
  expect(html).toContain("Erro em anos")
  expect(html).toContain("Distância")
  expect(html).toContain("Concluído")
  expect(html).toContain("155,2")
  expect(html).toContain("mi")
  expect(html).toContain("ft")
  expect(JSON.stringify(result)).toBe(before)
})

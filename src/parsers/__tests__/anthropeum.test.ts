import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { exportBackup, importBackup } from "@/lib/backup"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { anthropeumParser } from "../anthropeum"
import { parseInput } from "../index"

const example = readFileSync(
  new URL("../../../samples/anthropeum.txt", import.meta.url),
  "utf8",
).trim()
const grid = "🟩🟨🟥🟨🟦🟨🟨🟩🟥🟨"
const result = parseInput(example)[0]!
const data = (results = [result]): AppData => ({
  version: 1,
  entries: { "2026-10-03": { date: "2026-10-03", results } },
})

describe("Anthropeum", () => {
  test("parses the supplied share, using its date rather than today's date", () => {
    expect(anthropeumParser.parse(example.split("\n"), "2020-01-01")).toEqual({
      consumedLines: 3,
      result: {
        gameType: "anthropeum",
        date: "2026-10-03",
        won: true,
        score: 51973,
        topPercent: 94,
        grid: [grid],
        rawText: example,
      },
    })
  })

  test("accepts localized integer scores and an unavailable ranking", () => {
    for (const score of ["51,973", "51.973", "51 973", "51\u00a0973", "51\u202f973", "51973"]) {
      const input = `Anthropeum.com · Oct 3 2026\n${grid}\n${score}`
      expect(parseInput(input)).toEqual([
        {
          gameType: "anthropeum",
          date: "2026-10-03",
          won: true,
          score: 51973,
          grid: [grid],
          rawText: input,
        },
      ])
    }
  })

  test("accepts all month names and validates real calendar dates", () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    for (const [index, month] of months.entries()) {
      expect(parseInput(example.replace("Oct 3", `${month} 3`))[0]?.date).toBe(
        `2026-${String(index + 1).padStart(2, "0")}-03`,
      )
    }
    expect(parseInput(example.replace("Oct 3 2026", "Feb 29 2024"))[0]?.date).toBe("2024-02-29")
    for (const date of ["Foo 3 2026", "Feb 29 2026", "Sep 31 2026", "Oct 0 2026", "Oct 32 2026"]) {
      expect(parseInput(example.replace("Oct 3 2026", date))).toEqual([])
    }
  })

  test("accepts CRLF, blank lines and surrounding whitespace while retaining raw text", () => {
    const input = `  Anthropeum.com · Oct 3 2026\r\n\r\n ${grid} \r\n\r\n51,973 · top 94% of players today!  `
    expect(parseInput(input)[0]).toEqual({ ...result, rawText: input.trim() })
  })

  test("does not consume the following game's share", () => {
    const text = `${example}\n\nJoguei conexo.ws 29/01/2026 e consegui em 4 tentativas.\n🟩🟩🟩🟩`
    expect(parseInput(text).map((item) => item.gameType)).toEqual(["anthropeum", "conexo"])
    expect(parseInput(`${example}\n${example}`)).toHaveLength(2)
  })

  test("zero and maximum scores are completed games regardless of round colors", () => {
    for (const [row, score, topPercent] of [
      ["🟥".repeat(10), "0", 100],
      ["🟦".repeat(10), "100,000", 1],
    ] as const) {
      const parsed = parseInput(
        `Anthropeum.com · Oct 3 2026\n${row}\n${score} · top ${topPercent}% of players today!`,
      )[0]!
      expect(parsed.won).toBe(true)
      expect(calculateGameStats(data([parsed]), "anthropeum").winRate).toBe(100)
    }
    expect(
      calculateGameStats(data([createManualLoss("anthropeum", "2026-10-03")]), "anthropeum")
        .winRate,
    ).toBe(0)
  })

  test("rejects incomplete shares, invalid grids, scores and rankings", () => {
    const invalid = [
      example.split("\n").slice(0, 2).join("\n"),
      example.replace(grid, grid.slice(2)),
      example.replace(grid, `${grid}🟩`),
      example.replace("🟦", "⬜"),
      ...["100,001", "-1", "NaN", "51,97", "51.9", "1,000.000"].map((score) =>
        example.replace("51,973", score),
      ),
      ...["0", "101", "-1", "94.5"].map((percent) => example.replace("94%", `${percent}%`)),
    ]
    for (const input of invalid) expect(parseInput(input)).toEqual([])
    expect(anthropeumParser.detect(["Anthropeum"])).toBe(false)
    expect(anthropeumParser.parse(["Another game", grid, "51973"], "2026-10-03")).toBeNull()
  })

  test("shares the original score and ranking with either header mode", () => {
    const entry = data().entries["2026-10-03"]!
    expect(generateShareMessage(entry)).toContain(example)
    expect(generateShareMessage(entry, { gameNamesOnly: true })).toContain(
      `Anthropeum\n${grid}\n51,973 · top 94% of players today!`,
    )
    const loss = createManualLoss("anthropeum", "2026-10-03")
    expect(
      generateShareMessage({ date: loss.date, results: [loss] }, { gameNamesOnly: true }),
    ).toContain("Anthropeum ❌")
  })

  test("round trips scored, unranked and manual results through backup", () => {
    const unranked = parseInput(example.replace(" · top 94% of players today!", ""))[0]!
    for (const item of [result, unranked, createManualLoss("anthropeum", "2026-10-03")]) {
      expect(importBackup(exportBackup(data([item])))).toEqual(data([item]))
    }
  })

  test("rejects backup results with invalid scores, rankings or round data", () => {
    for (const fields of [
      { score: -1 },
      { score: 100001 },
      { score: 1.5 },
      { score: "51973" },
      { topPercent: 0 },
      { topPercent: 101 },
      { topPercent: 94.5 },
      { topPercent: "94" },
      { grid: [] },
      { grid: ["🟥"] },
      { grid: [grid, grid] },
      { won: false },
    ]) {
      const backup = JSON.stringify(data([{ ...result, ...fields } as typeof result]))
      expect(() => importBackup(backup)).toThrow("Invalid backup")
    }
  })
})

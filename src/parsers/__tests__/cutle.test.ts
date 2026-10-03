import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resultEditions, resultMetrics } from "@/design-system/result-presentation"
import { exportBackup, importBackup } from "@/lib/backup"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats, getWinRateForDate } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { cutleParser } from "../cutle"
import { parseInput } from "../index"

const example = readFileSync(new URL("../../../samples/cutle.txt", import.meta.url), "utf8").trim()
const parse = (text = example) => cutleParser.parse(text.split("\n"), "2027-01-01")?.result
const resultText = (ratio: string, emoji: string) =>
  example.replace("⬜ 45:55 ⬜", `${emoji} ${ratio} ${emoji}`)

describe("Cutle", () => {
  test("parses the example loss with its own date, edition and ratio", () => {
    const result = parse()
    expect(result).toEqual({
      gameType: "cutle",
      date: "2026-10-03",
      gameNumber: 314,
      ratio: [45, 55],
      won: false,
      grid: ["⬜ 45:55 ⬜"],
      rawText: example,
    })
    expect(parseInput(example)).toEqual([result!])
    expect(resultMetrics(result!)).toEqual([{ value: "45:55", label: "ratio" }])
    expect(resultEditions(result!)).toEqual([{ value: "#314" }])
  })

  test("recognizes both orientations, wins at 48 and perfect cuts", () => {
    for (const [ratio, emoji, won] of [
      ["0:100", "🟥", false],
      ["100:0", "🟥", false],
      ["44:56", "🟥", false],
      ["47:53", "⬜", false],
      ["53:47", "⬜", false],
      ["48:52", "✅", true],
      ["52:48", "✅", true],
      ["49:51", "✅", true],
      ["51:49", "✅", true],
      ["50:50", "🎉", true],
    ] as const) {
      expect(parse(resultText(ratio, emoji))?.won).toBe(won)
    }
  })

  test("accepts escaped URLs, archive links, Best shares and omitted links", () => {
    for (const input of [
      example.replace("https:", "https\\:"),
      example.replace("/cutle", "/cutle/?d=2026-10-03"),
      example.replace("#314:", "#314 Best:"),
      example.split(" - ")[0]!,
      `${example}\r\n`,
      resultText("48:52", "✅️"),
    ]) {
      expect(parse(input)?.gameType).toBe("cutle")
      expect(parse(input)?.rawText).toBe(input.trim())
    }
  })

  test("rejects impossible dates, ratios, editions and inconsistent symbols", () => {
    for (const input of [
      example.replace("#314", "#0"),
      example.replace("#314", "#9007199254740992"),
      example.replace("2026-10-03", "2026-02-29"),
      example.replace("2026-10-03", "2026-04-31"),
      example.replace("2026-10-03", "2026-13-03"),
      example.replace("45:55", "45:54"),
      example.replace("45:55", "101:0"),
      example.replace("45:55", "-1:101"),
      example.replace("45:55", "45.5:54.5"),
      example.replace("45:55", "48:52"),
      example.replace("55 ⬜", "55 ✅"),
      "Cutle #314",
    ])
      expect(parseInput(input)).toEqual([])
    expect(parse(example.replace("2026-10-03", "2028-02-29"))?.date).toBe("2028-02-29")
  })

  test("does not consume an adjacent game", () => {
    const other = "Joguei conexo.ws 03/10/2026 e consegui em 4 tentativas.\n🟩🟩🟩🟩"
    const results = parseInput(`${example}\n${other}`)
    expect(results.map((result) => result.gameType)).toEqual(["cutle", "conexo"])
    expect(results[0]?.rawText).toBe(example)
  })

  test("preserves ratios in both sharing modes and removes ordinary or escaped links", () => {
    for (const input of [example, example.replace("https:", "https\\:")]) {
      for (const gameNamesOnly of [false, true]) {
        const result = parse(input)!
        const before = JSON.stringify(result)
        const message = generateShareMessage(
          { date: result.date, results: [result] },
          { gameNamesOnly },
        )
        expect(message).toContain("⬜ 45:55 ⬜")
        expect(message).not.toContain("https")
        expect(message.split("\n").at(-1)).not.toEndWith(" -")
        expect(message.includes("#314")).toBe(!gameNamesOnly)
        expect(JSON.stringify(result)).toBe(before)
      }
    }
  })

  test("round trips wins, losses and manual losses, including filtered stats", () => {
    const data: AppData = {
      version: 1,
      entries: {
        "2026-10-03": { date: "2026-10-03", results: [parse()!] },
        "2026-10-04": {
          date: "2026-10-04",
          results: [parse(resultText("48:52", "✅").replace("2026-10-03", "2026-10-04"))!],
        },
        "2026-10-05": { date: "2026-10-05", results: [createManualLoss("cutle", "2026-10-05")] },
      },
    }
    expect(importBackup(exportBackup(data))).toEqual(data)
    expect(calculateGameStats(data, "cutle")).toMatchObject({
      totalPlayed: 3,
      totalWon: 1,
      winRate: 33,
    })
    expect(getWinRateForDate(data, "2026-10-04", new Set(["cutle"]))).toBe(100)
    const manual = data.entries["2026-10-05"]!
    expect(resultMetrics(manual.results[0]!)).toEqual([{ value: "—", label: "manual" }])
    expect(generateShareMessage(manual, { gameNamesOnly: true })).toContain("Cutle ❌")
  })

  test("rejects incomplete or inconsistent Cutle backups", () => {
    for (const invalid of [
      { ratio: [45, 54] },
      { ratio: [45] },
      { ratio: [45.5, 54.5] },
      { ratio: [-1, 101] },
      { ratio: ["45", "55"] },
      { ratio: [0, 0] },
      { ratio: undefined },
      { gameNumber: -1 },
      { gameNumber: 1.5 },
      { gameNumber: 0 },
      { won: true },
    ]) {
      const data = {
        version: 1,
        entries: { "2026-10-03": { date: "2026-10-03", results: [{ ...parse()!, ...invalid }] } },
      }
      expect(() => importBackup(JSON.stringify(data))).toThrow("Invalid backup")
    }
  })
})

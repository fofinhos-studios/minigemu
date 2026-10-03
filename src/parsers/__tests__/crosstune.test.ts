import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resultEditions, resultMetrics } from "@/design-system/result-presentation"
import { exportBackup, importBackup } from "@/lib/backup"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats, getWinRateForDate } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { crosstuneParser } from "../crosstune"
import { parseInput } from "../index"

const example = readFileSync(
  new URL("../../../samples/crosstune.txt", import.meta.url),
  "utf8",
).trim()
const parse = (text = example, date = "2026-10-03") =>
  crosstuneParser.parse(text.split("\n"), date)?.result

describe("Crosstune", () => {
  test("parses the shared edition, date, time and flawless finish", () => {
    const result = parse()
    expect(result).toEqual({
      gameType: "crosstune",
      date: "2026-10-03",
      won: true,
      gameNumber: 523,
      timeSeconds: 336,
      flawless: true,
      grid: [],
      rawText: example,
    })
    expect(parseInput(example).map((item) => item.gameType)).toEqual(["crosstune"])
    expect(resultMetrics(result!)).toEqual([{ value: "5:36", label: "time" }])
    expect(resultEditions(result!)).toEqual([{ value: "#523" }])
  })
  test("accepts CRLF, an optional link and a markdown link", () => {
    for (const input of [
      example.replaceAll("\n", "\r\n"),
      example.split("\n").slice(0, -1).join("\n"),
      example.replace(
        "https://crosstune.io/s/daily",
        "[https://crosstune.io/s/daily](https://crosstune.io/s/daily)",
      ),
    ]) {
      expect(parse(input)?.gameType).toBe("crosstune")
      expect(parse(input)?.rawText).toBe(input.trim())
    }
  })
  test("handles zero seconds and long solve times", () => {
    for (const [time, seconds] of [
      ["0:00", 0],
      ["65:09", 3909],
    ] as const) {
      const result = parse(example.replace("5:36", time))
      expect(result?.gameType === "crosstune" && result.timeSeconds).toBe(seconds)
      expect(resultMetrics(result!)[0]?.value).toBe(time)
    }
  })
  test("counts completion without the flawless qualifier as a win", () => {
    const result = parse(example.replace(" flawlessly", ""))
    expect(result?.won).toBe(true)
    expect(result?.gameType === "crosstune" && result.flawless).toBe(false)
  })
  test("chooses nearby years at year boundaries and validates calendar dates", () => {
    expect(parse(example.replace("October 3rd", "December 31st"), "2027-01-01")?.date).toBe(
      "2026-12-31",
    )
    expect(parse(example.replace("October 3rd", "January 1st"), "2026-12-31")?.date).toBe(
      "2027-01-01",
    )
    expect(parse(example.replace("October 3rd", "February 29th"), "2028-03-01")?.date).toBe(
      "2028-02-29",
    )
    expect(parse(example.replace("October 3rd", "February 29th"))).toBeUndefined()
  })
  test("rejects malformed headers, dates, times and incomplete results", () => {
    for (const input of [
      "Crosstune #523 - October 3rd",
      example.replace("#523", "#0"),
      example.replace("#523", "#9007199254740992"),
      example.replace("October 3rd", "Octember 3rd"),
      example.replace("October 3rd", "April 31st"),
      example.replace("October 3rd", "October 0th"),
      example.replace("5:36", "5:60"),
      example.replace("5:36", "-5:36"),
      example.replace("5:36", "9007199254740992:00"),
      example.replace("✅", "❌"),
    ])
      expect(parseInput(input)).toEqual([])
  })
  test("does not consume another game, with or without its optional URL", () => {
    const other = "Joguei conexo.ws 03/10/2026 e consegui em 4 tentativas.\n🟩🟩🟩🟩"
    for (const input of [example, example.split("\n").slice(0, -1).join("\n")]) {
      const results = parseInput(`${input}\n\n${other}`)
      expect(results.map((result) => result.gameType)).toEqual(["crosstune", "conexo"])
      expect(results[0]?.rawText).toBe(input.trim())
    }
  })
  test("preserves time and flawless finish in both sharing modes", () => {
    const entry = { date: "2026-10-03", results: [parse()!] }
    for (const gameNamesOnly of [false, true]) {
      const message = generateShareMessage(entry, { gameNamesOnly })
      expect(message).toContain("I solved the puzzle in 5:36 flawlessly ✅.")
      expect(message).not.toContain("https://")
      expect(message.includes("#523")).toBe(!gameNamesOnly)
    }
  })
  test("round trips solved and manual loss results and counts their stats", () => {
    const data: AppData = {
      version: 1,
      entries: {
        "2026-10-03": { date: "2026-10-03", results: [parse()!] },
        "2026-10-04": {
          date: "2026-10-04",
          results: [createManualLoss("crosstune", "2026-10-04")],
        },
      },
    }
    expect(importBackup(exportBackup(data))).toEqual(data)
    expect(calculateGameStats(data, "crosstune").winRate).toBe(50)
    expect(getWinRateForDate(data, "2026-10-03", new Set(["crosstune"]))).toBe(100)
    expect(getWinRateForDate(data, "2026-10-04", new Set(["crosstune"]))).toBe(0)
    expect(generateShareMessage(data.entries["2026-10-04"]!, { gameNamesOnly: true })).toContain(
      "Crosstune ❌",
    )
  })
  test("rejects malformed time, edition and flawless values in backups", () => {
    for (const invalid of [
      { timeSeconds: -1 },
      { timeSeconds: 1.5 },
      { gameNumber: 0 },
      { flawless: "true" },
    ]) {
      const data = {
        version: 1,
        entries: { "2026-10-03": { date: "2026-10-03", results: [{ ...parse()!, ...invalid }] } },
      }
      expect(() => importBackup(JSON.stringify(data))).toThrow("Invalid backup")
    }
  })
})

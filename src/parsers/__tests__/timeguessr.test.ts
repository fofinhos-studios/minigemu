import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { exportBackup, importBackup } from "@/lib/backup"
import { todayKey } from "@/lib/dates"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats, getWinRateForDate } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { parseInput } from "../index"
import { timeGuessrParser } from "../timeguessr"

const example = readFileSync(
  new URL("../../../samples/timeguessr.txt", import.meta.url),
  "utf8",
).trim()
const withoutLink = example.slice(0, example.lastIndexOf("\n\n"))

function parsed(input = example) {
  const result = parseInput(input)[0]
  if (result?.gameType !== "timeguessr") throw new Error("Expected TimeGuessr result")
  return result
}

describe("TimeGuessr", () => {
  test("parses the example with all five scores, year errors and original distance units", () => {
    expect(parseInput(example)).toHaveLength(1)
    const result = parsed()
    expect(result.date).toBe(todayKey())
    expect(result.gameNumber).toBe(1221)
    expect(result.score).toBe(34395)
    expect(result.won).toBe(true)
    expect(result.rounds).toEqual([
      { score: 9982, yearError: 0, distance: 2949, distanceUnit: "ft" },
      { score: 5964, yearError: 17, distance: 3331, distanceUnit: "ft" },
      { score: 6750, yearError: 8, distance: 155.2, distanceUnit: "mi" },
      { score: 8894, yearError: 5, distance: 948, distanceUnit: "ft" },
      { score: 2805, yearError: 14, distance: 2160.2, distanceUnit: "mi" },
    ])
    expect(result.grid).toEqual(example.split("\n").slice(2, 7))
    expect(result.rawText).toBe(example)
  })

  test("accepts CRLF, no URL, ungrouped numbers, metric units and optional keycap selectors", () => {
    expect(parsed(example.replaceAll("\n", "\r\n")).score).toBe(34395)
    expect(parsed(withoutLink).rawText).toBe(withoutLink)
    const variant = withoutLink
      .replaceAll(",", "")
      .replaceAll("️", "")
      .replace("2949ft", "2,949.5m")
      .replace("155.2mi", "155.2km")
    expect(parsed(variant).rounds[0]?.distance).toBe(2949.5)
    expect(parsed(variant).rounds[2]?.distanceUnit).toBe("km")
  })

  test("does not consume another game's result, with or without the optional URL", () => {
    const other = "Joguei conexo.ws 29/01/2026 e consegui em 4 tentativas.\n🟩🟩🟩🟩"
    for (const text of [example, withoutLink]) {
      expect(parseInput(`${text}\n\n${other}`).map((result) => result.gameType)).toEqual([
        "timeguessr",
        "conexo",
      ])
    }
    expect(timeGuessrParser.parse(withoutLink.split("\n"), "2026-10-03")?.result.date).toBe(
      "2026-10-03",
    )
  })

  test("rejects missing, duplicate, extra, malformed and inconsistent rounds", () => {
    const invalid = [
      withoutLink.split("\n").slice(0, -1).join("\n"),
      withoutLink.replace("2️⃣", "1️⃣"),
      `${withoutLink}\n6️⃣ 🏆0 · 📅 0y · 🌍 0ft`,
      withoutLink.replace("34,395", "34,396"),
      withoutLink.replace("50,000", "60,000"),
      withoutLink.replace("9,982", "10,001"),
      withoutLink.replace("9,982", "9,98"),
      withoutLink.replace("17y", "-17y"),
      withoutLink.replace("2949ft", "-1ft"),
      withoutLink.replace("2949ft", "2949parsecs"),
      withoutLink.replace("#1221", "#9007199254740992"),
    ]
    for (const text of invalid) expect(parseInput(text)).toEqual([])
  })

  test("treats zero and perfect scores as completed, and manual entries as losses", () => {
    for (const score of [0, 10000]) {
      const text = [
        `TimeGuessr #1 — ${score * 5}/50000`,
        ...Array.from({ length: 5 }, (_, i) => `${i + 1}️⃣ 🏆${score} · 📅 0y · 🌍 0ft`),
      ].join("\n")
      const result = parsed(text)
      const date = result.date
      const data: AppData = { version: 1, entries: { [date]: { date, results: [result] } } }
      expect(calculateGameStats(data, "timeguessr").winRate).toBe(100)
      expect(getWinRateForDate(data, date, new Set(["timeguessr"]))).toBe(100)
      data.entries[date]!.results = [createManualLoss("timeguessr", date)]
      expect(calculateGameStats(data, "timeguessr").winRate).toBe(0)
    }
  })

  test("round trips scored and manual results and rejects corrupted backups", () => {
    const result = parsed()
    const data: AppData = {
      version: 1,
      entries: {
        [result.date]: {
          date: result.date,
          results: [result, createManualLoss("timeguessr", result.date)],
        },
      },
    }
    expect(importBackup(exportBackup(data))).toEqual(data)
    for (const invalid of [
      { ...result, score: result.score + 1 },
      { ...result, rounds: result.rounds.slice(1) },
      { ...result, rounds: [{ ...result.rounds[0], distance: -1 }, ...result.rounds.slice(1)] },
      {
        ...result,
        rounds: [{ ...result.rounds[0], distanceUnit: "parsecs" }, ...result.rounds.slice(1)],
      },
    ]) {
      const corrupt = {
        version: 1,
        entries: { [result.date]: { date: result.date, results: [invalid] } },
      }
      expect(() => importBackup(JSON.stringify(corrupt))).toThrow("Invalid backup")
    }
  })

  test("shares the total and every original round, with names-only hiding the edition", () => {
    const result = parsed()
    const entry = { date: result.date, results: [result] }
    const message = generateShareMessage(entry)
    expect(message).toContain(withoutLink)
    expect(message).not.toContain("https://")
    const namesOnly = generateShareMessage(entry, { gameNamesOnly: true })
    expect(namesOnly).toContain("TimeGuessr — 34,395/50,000")
    expect(namesOnly).not.toContain("#1221")
    for (const row of result.grid) expect(namesOnly).toContain(row)
    expect(
      generateShareMessage(
        { date: result.date, results: [createManualLoss("timeguessr", result.date)] },
        { gameNamesOnly: true },
      ),
    ).toContain("TimeGuessr ❌")
  })
})

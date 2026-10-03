import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resultMetrics } from "@/design-system/result-presentation"
import { exportBackup, importBackup } from "@/lib/backup"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { chartleParser } from "../chartle"
import { parseInput } from "../index"

const example = readFileSync(
  new URL("../../../samples/chartle.txt", import.meta.url),
  "utf8",
).trim()
const header = "📈 Chartle for 03 Oct 2026: Aquaculture production"
const win = `${header}\n\nGuessed in 2 tries\n🟥✅⬜️⬜️⬜️\n\nPlay at https://chartle.cc`

describe("Chartle", () => {
  test("parses the supplied loss using the share date and preserves its text", () => {
    const results = parseInput(example)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      gameType: "chartle",
      date: "2026-10-03",
      chartTitle: "Aquaculture production",
      won: false,
      attempts: 5,
      grid: ["🟥🟥🟥🟥🟥"],
      rawText: example,
    })
    expect(chartleParser.parse(example.split("\n"), "2027-01-01")?.result.date).toBe("2026-10-03")
    expect(resultMetrics(results[0]!)).toEqual([{ value: 5, label: "attempts" }])
    const entry = { date: "2026-10-03", results }
    expect(generateShareMessage(entry)).toContain(header)
    expect(generateShareMessage(entry)).not.toContain("Play at")
    expect(generateShareMessage(entry)).not.toContain("https://")
    expect(generateShareMessage(entry, { gameNamesOnly: true })).toContain("Chartle\n🟥🟥🟥🟥🟥")
  })

  test("recognizes the real checkmark win format on every attempt", () => {
    for (let attempts = 1; attempts <= 5; attempts++) {
      const grid = `${"🟥".repeat(attempts - 1)}✅${"⬜️".repeat(5 - attempts)}`
      const input = `${header}\nGuessed in ${attempts} ${attempts === 1 ? "try" : "tries"}\n${grid}`
      expect(parseInput(input)[0]).toMatchObject({ won: true, attempts, grid: [grid] })
    }
    expect(parseInput(win)[0]).toMatchObject({ won: true, attempts: 2 })
  })

  test("accepts CRLF, whitespace, archived links and early surrender", () => {
    const input = win.replace("🟥✅⬜️⬜️⬜️", "🟥 ✅️ ⬜️ ⬜️ ⬜️").replaceAll("\n", "\r\n")
    expect(parseInput(input)[0]).toMatchObject({ won: true, attempts: 2 })
    const archived = example.replace("https://chartle.cc", "https://chartle.cc/#2026-10-03")
    expect(parseInput(archived)[0]?.rawText).toBe(archived)
    expect(parseInput(example.replace("🟥🟥🟥🟥🟥", "🟥🟥⬜️⬜️⬜️"))[0]).toMatchObject({
      won: false,
      attempts: 2,
    })
  })

  test("validates dates, including leap days, and rejects malformed results", () => {
    expect(parseInput(example.replace("03 Oct 2026", "29 Feb 2024"))[0]?.date).toBe("2024-02-29")
    for (const input of [
      header,
      example.replace("03 Oct 2026", "31 Apr 2026"),
      example.replace("03 Oct 2026", "29 Feb 2026"),
      example.replace("03 Oct 2026", "00 Oct 2026"),
      example.replace("Oct", "Foo"),
      example.replace(": Aquaculture production", ": "),
      example.replace("🟥🟥🟥🟥🟥", "🟥🟥🟥🟥"),
      example.replace("🟥🟥🟥🟥🟥", "🟥🟥🟥🟥🟥🟥"),
      example.replace("🟥🟥🟥🟥🟥", "🟥🟥🟥🟥✅"),
      win.replace("2 tries", "3 tries"),
      win.replace("🟥✅⬜️⬜️⬜️", "✅🟥⬜️⬜️⬜️"),
      win.replace("🟥✅⬜️⬜️⬜️", "🟥🟩⬜️⬜️⬜️"),
    ])
      expect(parseInput(input)).toEqual([])
  })

  test("does not swallow adjacent game results", () => {
    const next = "#GuessTheGame #1618\n🎮 🟥 🟩 ⬜ ⬜ ⬜ ⬜"
    for (const input of [example, win, win.replace(/\n\nPlay at .+$/, "")]) {
      for (const separator of ["\n", "\n\n"]) {
        const results = parseInput(`${input}${separator}${next}`)
        expect(results.map((result) => result.gameType)).toEqual(["chartle", "guessthegame"])
        expect(results[0]?.rawText).toBe(input)
      }
    }
    expect(parseInput(`${next}\n\n${example}`).map((result) => result.gameType)).toEqual([
      "guessthegame",
      "chartle",
    ])
  })

  test("supports statistics, manual losses and backup round trips", () => {
    const results = [
      parseInput(win)[0]!,
      parseInput(example)[0]!,
      createManualLoss("chartle", "2026-10-05"),
    ]
    const data: AppData = { version: 1, entries: {} }
    results.forEach((result, index) => {
      const date = `2026-10-0${3 + index}`
      data.entries[date] = { date, results: [{ ...result, date }] }
    })
    expect(calculateGameStats(data, "chartle")).toMatchObject({
      totalPlayed: 3,
      totalWon: 1,
      winRate: 33,
    })
    expect(importBackup(exportBackup(data))).toEqual(data)
    expect(results[2]).toMatchObject({ won: false, chartTitle: "", attempts: 0 })
    for (const fields of [
      { attempts: 6 },
      { attempts: -1 },
      { attempts: "2" },
      { chartTitle: null },
    ]) {
      const invalid = structuredClone(data)
      Object.assign(invalid.entries["2026-10-03"]!.results[0]!, fields)
      expect(() => importBackup(exportBackup(invalid))).toThrow("Invalid backup")
    }
  })
})

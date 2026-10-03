import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resultMetrics } from "@/design-system/result-presentation"
import { exportBackup, importBackup } from "@/lib/backup"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { parseInput } from "../index"
import { zoomOutParser } from "../zoomout"

const example = readFileSync(
  new URL("../../../samples/zoomout.txt", import.meta.url),
  "utf8",
).trim()
const header = "🔎 ZoomOut 2026-10-03: "

describe("ZoomOut", () => {
  test("parses the supplied message using its date and preserves the original text", () => {
    const results = parseInput(example)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      gameType: "zoomout",
      date: "2026-10-03",
      won: true,
      attempts: 2,
      grid: ["🟥🟩⬛⬛⬛"],
      rawText: example,
    })
    expect(zoomOutParser.parse(example.split("\n"), "2027-01-01")?.result.date).toBe("2026-10-03")
    expect(resultMetrics(results[0]!)).toEqual([{ value: 2, label: "attempts" }])
    const entry = { date: "2026-10-03", results }
    expect(generateShareMessage(entry)).toContain(`${header}🟥🟩⬛⬛⬛ 😎`)
    expect(generateShareMessage(entry)).not.toContain("https://")
    expect(generateShareMessage(entry, { gameNamesOnly: true })).toContain("ZoomOut\n🟥🟩⬛⬛⬛")
  })

  test("counts all five attempts and treats franchise matches as unsuccessful guesses", () => {
    for (let attempts = 1; attempts <= 5; attempts++) {
      const row = `${"🟧".repeat(attempts - 1)}🟩${"⬛".repeat(5 - attempts)}`
      expect(parseInput(`${header}${row}`)[0]).toMatchObject({ won: true, attempts, grid: [row] })
    }
    for (const row of ["🟥🟥🟥🟥🟥", "🟥🟧🟥🟧🟧"]) {
      expect(parseInput(`${header}${row} 😩`)[0]).toMatchObject({ won: false, attempts: 5 })
    }
    expect(parseInput(`${header}🟥🟧⬛⬛⬛ 😭`)[0]).toMatchObject({ won: false, attempts: 2 })
  })

  test("accepts CRLF, spaced cells, optional emoji, archived links and escaped URL colons", () => {
    const input = example
      .replace("🔎 ", "")
      .replace("🟥🟩⬛⬛⬛", "🟥 🟩 ⬛️ ⬛️ ⬛️")
      .replace("https:", "https\\:")
      .replace("videoludid.com", "videoludid.com/daily/2026-10-03")
      .replaceAll("\n", "\r\n")
    const results = parseInput(input)
    expect(results[0]).toMatchObject({
      won: true,
      attempts: 2,
      grid: ["🟥🟩⬛⬛⬛"],
      rawText: input,
    })
    expect(generateShareMessage({ date: "2026-10-03", results })).not.toContain("https")
  })

  test("rejects invalid dates and malformed or impossible attempt sequences", () => {
    expect(parseInput(example.replace("2026-10-03", "2024-02-29"))[0]?.date).toBe("2024-02-29")
    for (const date of ["2026-02-29", "2026-04-31", "2026-13-03", "2026-10-00"]) {
      expect(parseInput(example.replace("2026-10-03", date))).toEqual([])
    }
    for (const row of [
      "",
      "🟥🟩⬛⬛",
      "🟥🟩⬛⬛⬛⬛",
      "🟩🟥⬛⬛⬛",
      "🟩🟩⬛⬛⬛",
      "⬛🟩⬛⬛⬛",
      "⬛⬛⬛⬛⬛",
    ]) {
      expect(parseInput(`${header}${row}`)).toEqual([])
    }
    expect(parseInput("🔎 ZoomOut: October 2026 (1/31 days):\n😎")).toEqual([])
  })

  test("keeps optional spoiler guesses and does not consume adjacent games or foreign links", () => {
    const next = "#GuessTheGame #1618\n🎮 🟥 🟩 ⬜ ⬜ ⬜ ⬜"
    const spoilers = "My guesses: ||🟥 Some game, 🟩 Found it!||"
    const withGuesses = example.replace("\nhttps", `\n${spoilers}\nhttps`)
    for (const input of [example, example.split("\n")[0]!, withGuesses]) {
      for (const separator of ["\n", "\n\n"]) {
        const results = parseInput(`${input}${separator}${next}`)
        expect(results.map((result) => result.gameType)).toEqual(["zoomout", "guessthegame"])
        expect(results[0]?.rawText).toBe(input)
      }
    }
    expect(parseInput(`${header}🟥🟩⬛⬛⬛\nhttps://other.example`)[0]?.rawText).not.toContain(
      "other.example",
    )
    expect(parseInput(`${next}\n\n${example}`).map((result) => result.gameType)).toEqual([
      "guessthegame",
      "zoomout",
    ])
  })

  test("supports statistics, manual losses and backup round trips", () => {
    const data: AppData = {
      version: 1,
      entries: {
        "2026-10-03": { date: "2026-10-03", results: parseInput(example) },
        "2026-10-04": {
          date: "2026-10-04",
          results: parseInput("🔎 ZoomOut 2026-10-04: 🟥🟥🟧🟥🟧 😩"),
        },
        "2026-10-05": { date: "2026-10-05", results: [createManualLoss("zoomout", "2026-10-05")] },
      },
    }
    expect(calculateGameStats(data, "zoomout")).toMatchObject({
      totalPlayed: 3,
      totalWon: 1,
      winRate: 33,
    })
    expect(importBackup(exportBackup(data))).toEqual(data)
    expect(createManualLoss("zoomout", "2026-10-05")).toMatchObject({ won: false, attempts: 0 })
    for (const attempts of [-1, 0, 6, 1.5, "2"]) {
      const invalid = structuredClone(data)
      Object.assign(invalid.entries["2026-10-03"]!.results[0]!, { attempts })
      expect(() => importBackup(exportBackup(invalid))).toThrow("Invalid backup")
    }
  })
})

import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resultEditions, resultMetrics } from "@/design-system/result-presentation"
import { exportBackup, importBackup } from "@/lib/backup"
import { todayKey } from "@/lib/dates"
import { generateShareMessage } from "@/lib/message"
import { calculateGameStats, getWinRateForDate } from "@/lib/stats"
import { type AppData, createManualLoss } from "@/types/games"
import { parseInput } from "../index"
import { spotleParser } from "../spotle"

const example = readFileSync(new URL("../../../samples/spotle.txt", import.meta.url), "utf8").trim()
const header = "Spotle.io #1618\n\n📅👥📈🚻💽🌎"
const win = `${header}\n⬜⬜⬜⬜🟩⬜\n🟩🟩🟩🟩🟩🟩`

describe("Spotle", () => {
  test("preserves the supplied share and counts ten guesses as a loss", () => {
    const results = parseInput(example)
    expect(results).toHaveLength(1)
    const result = results[0]!
    expect(result).toMatchObject({
      gameType: "spotle",
      gameNumber: 1618,
      attempts: 10,
      date: todayKey(),
      won: false,
      grid: example.split("\n").slice(2),
      rawText: example,
    })
    expect(resultMetrics(result)).toEqual([{ value: 10, label: "attempts" }])
    expect(resultEditions(result)).toEqual([{ value: "#1618" }])
    const entry = { date: result.date, results }
    expect(generateShareMessage(entry)).toContain(example)
    expect(generateShareMessage(entry, { gameNamesOnly: true })).toContain(
      ["Spotle", ...result.grid].join("\n"),
    )
  })

  test("requires all six green criteria to win and accepts a win on the last guess", () => {
    expect(parseInput(win)[0]).toMatchObject({ won: true, attempts: 2 })
    expect(parseInput(`${header}\n🟩🟩🟩🟩🟩⬜`)[0]?.won).toBe(false)
    const lastGuess = [...example.split("\n").slice(0, -1), "🟩🟩🟩🟩🟩🟩"].join("\n")
    expect(parseInput(lastGuess)[0]).toMatchObject({ won: true, attempts: 10 })
    expect(spotleParser.parse(win.split("\n"), "2026-09-26")?.result.date).toBe("2026-09-26")
  })

  test("supports CRLF, variation selectors, spaces, optional criteria and site link", () => {
    const spaced = win.replace("🟩🟩🟩🟩🟩🟩", Array(6).fill("🟩️").join(" "))
    const input = `${spaced}\n\nhttps://spotle.io/`.replaceAll("\n", "\r\n")
    expect(parseInput(input)[0]).toMatchObject({ won: true, attempts: 2 })
    expect(parseInput("spotle.io #1618\n🟩🟩🟩🟩🟩🟩")[0]).toMatchObject({
      won: true,
      attempts: 1,
    })
  })

  test("keeps neighboring game headers and grids separate in a combined paste", () => {
    const next = "#GuessTheGame #1618\n🎮 🟥 🟩 ⬜ ⬜ ⬜ ⬜"
    for (const separator of ["\n", "\n\n"]) {
      expect(parseInput(`${example}${separator}${next}`).map((result) => result.gameType)).toEqual([
        "spotle",
        "guessthegame",
      ])
    }
    const results = parseInput(`${next}\n\n${win}`)
    expect(results.map((result) => result.gameType)).toEqual(["guessthegame", "spotle"])
    expect(results[1]?.grid).toEqual(win.split("\n").slice(2))
    const gamedle = "Gamedle\n🕹️ (Capa) #1377:\n🟥🟩⬜⬜⬜⬜"
    const combined = parseInput(`${gamedle}\n\n${example}`)
    expect(combined.map((result) => result.gameType)).toEqual(["gamedle", "spotle"])
    expect(combined[0]?.rawText).toBe(gamedle)
  })

  test("rejects missing grids, invalid rows, invalid editions and extra guesses", () => {
    for (const input of [
      header,
      win.replace("#1618", "#0"),
      win.replace("#1618", "#9007199254740992"),
      `${header}\n🟩🟩🟩🟩🟩`,
      `${header}\n🟨🟩⬜🟩⬜🟩\n🟨🟩⬜🟩⬜`,
      `${header}\n🟥🟥🟥🟥🟥🟥`,
      `${example}\n🟩🟩🟩🟩🟩🟩`,
      `${win}\n⬜⬜⬜⬜⬜⬜`,
    ]) {
      expect(parseInput(input)).toEqual([])
    }
  })

  test("tracks wins, shared losses and manual losses in statistics and backups", () => {
    const results = [
      parseInput(win)[0]!,
      parseInput(example)[0]!,
      createManualLoss("spotle", "2026-09-28"),
    ]
    const data: AppData = { version: 1, entries: {} }
    results.forEach((result, index) => {
      const date = `2026-09-${26 + index}`
      data.entries[date] = { date, results: [{ ...result, date }] }
    })
    expect(calculateGameStats(data, "spotle")).toMatchObject({
      totalWon: 1,
      totalPlayed: 3,
      winRate: 33,
    })
    expect(getWinRateForDate(data, "2026-09-26", new Set(["spotle"]))).toBe(100)
    expect(getWinRateForDate(data, "2026-09-27", new Set(["spotle"]))).toBe(0)
    expect(importBackup(exportBackup(data))).toEqual(data)
    expect(results[2]).toMatchObject({ gameType: "spotle", gameNumber: 0, attempts: 0, won: false })

    for (const fields of [
      { attempts: 11 },
      { gameNumber: -1 },
      { attempts: "2" },
      { gameNumber: "1618" },
    ]) {
      const invalid = structuredClone(data)
      Object.assign(invalid.entries["2026-09-26"]!.results[0]!, fields)
      expect(() => importBackup(exportBackup(invalid))).toThrow("Invalid backup")
    }
  })
})

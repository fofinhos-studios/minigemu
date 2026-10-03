import { describe, expect, test } from "bun:test"
import { createManualLoss, GAME_INFO, GAME_ORDER, getSubGameEntries } from "../games"

test("every game has a local favicon path", () => {
  for (const game of GAME_ORDER) {
    expect(GAME_INFO[game].favicon).toBe(
      `/favicons/${game}.${["zoomout", "cutle", "krillion", "sizeitup"].includes(game) ? "png" : "ico"}`,
    )
  }
})

describe("createManualLoss", () => {
  test("creates compact share result for selected game and date", () => {
    expect(createManualLoss("expresso", "2026-06-13")).toEqual({
      gameType: "expresso",
      date: "2026-06-13",
      won: false,
      grid: ["❌"],
      rawText: "Expresso ❌",
      attempts: 0,
    })
  })

  test("tracks mode-based games as losses without mode data", () => {
    expect(getSubGameEntries(createManualLoss("gamedle", "2026-06-13"))).toEqual([
      { key: "gamedle", won: false },
    ])
    expect(getSubGameEntries(createManualLoss("termo", "2026-06-13"))).toEqual([
      { key: "termo", won: false },
    ])
  })

  test("can mark Krillion as a manual loss", () => {
    expect(createManualLoss("krillion", "2026-09-26")).toEqual({
      gameType: "krillion",
      date: "2026-09-26",
      won: false,
      grid: ["❌"],
      rawText: "Krillion ❌",
      gameNumber: 0,
      score: 0,
      tiers: [],
    })
  })

  test("creates a manual Size It Up loss without round data", () => {
    expect(createManualLoss("sizeitup", "2026-09-26")).toEqual({
      gameType: "sizeitup",
      date: "2026-09-26",
      won: false,
      grid: ["❌"],
      rawText: "Size It Up ❌",
      overallScore: 0,
      roundScores: [],
    })
  })
})

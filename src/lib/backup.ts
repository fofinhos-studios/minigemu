import { isKrillionTier, krillionDate, krillionScore } from "@/lib/krillion"
import type { AppData, DayEntry, GameResult, GameType } from "@/types/games"
import { GAME_ORDER } from "@/types/games"

const BACKUP_PREFIX = "daily-game-tracker:"
const SUPPORTED_VERSION = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isGameResult(value: unknown): value is GameResult {
  if (!isRecord(value)) return false
  const validBase =
    GAME_ORDER.includes(value.gameType as GameType) &&
    typeof value.date === "string" &&
    typeof value.won === "boolean" &&
    Array.isArray(value.grid) &&
    value.grid.every((row) => typeof row === "string") &&
    typeof value.rawText === "string"
  if (!validBase) return false

  switch (value.gameType) {
    case "cutle": {
      if (
        !Number.isSafeInteger(value.gameNumber) ||
        Number(value.gameNumber) < 0 ||
        !Array.isArray(value.ratio) ||
        value.ratio.length !== 2 ||
        !value.ratio.every((part) => Number.isInteger(part) && part >= 0 && part <= 100)
      ) {
        return false
      }
      const [left, right] = value.ratio as [number, number]
      if (value.gameNumber === 0) {
        return !value.won && left === 0 && right === 0 && value.rawText === "Cutle ❌"
      }
      return left + right === 100 && value.won === Math.min(left, right) >= 48
    }
    case "conexo":
      return typeof value.attempts === "number" && typeof value.hints === "number"
    case "expresso":
    case "letroso":
      return typeof value.attempts === "number"
    case "framed":
    case "guessthegame":
      return typeof value.gameNumber === "number"
    case "krillion": {
      if (
        typeof value.gameNumber !== "number" ||
        !Number.isSafeInteger(value.gameNumber) ||
        typeof value.score !== "number" ||
        !Number.isSafeInteger(value.score) ||
        !Array.isArray(value.tiers) ||
        !value.tiers.every(isKrillionTier)
      ) {
        return false
      }
      if (!value.won) {
        return value.gameNumber === 0 && value.score === 0 && value.tiers.length === 0
      }
      return (
        value.tiers.length === 7 &&
        value.score === krillionScore(value.tiers) &&
        value.date === krillionDate(value.gameNumber)
      )
    }
    case "sizeitup": {
      if (
        typeof value.overallScore !== "number" ||
        !Number.isInteger(value.overallScore) ||
        value.overallScore < 0 ||
        value.overallScore > 500 ||
        !Array.isArray(value.roundScores) ||
        !value.roundScores.every((score) => Number.isInteger(score) && score >= 0 && score <= 100)
      ) {
        return false
      }
      if (!value.won) {
        return value.overallScore === 0 && value.roundScores.length === 0
      }
      return (
        value.roundScores.length === 5 &&
        Array.isArray(value.grid) &&
        value.grid.length === 5 &&
        value.roundScores.reduce((sum, score) => sum + score, 0) === value.overallScore
      )
    }
    case "gamedle":
      return (
        Array.isArray(value.modes) &&
        value.modes.every(
          (mode) =>
            isRecord(mode) &&
            typeof mode.mode === "string" &&
            typeof mode.emoji === "string" &&
            typeof mode.gameNumber === "number" &&
            typeof mode.grid === "string" &&
            typeof mode.won === "boolean",
        )
      )
    case "termo":
      return (
        Array.isArray(value.modes) &&
        value.modes.every(
          (mode) =>
            isRecord(mode) &&
            typeof mode.mode === "string" &&
            typeof mode.gameNumber === "number" &&
            typeof mode.streak === "number" &&
            Array.isArray(mode.grid) &&
            mode.grid.every((row) => typeof row === "string") &&
            typeof mode.attempts === "string",
        )
      )
    default:
      return false
  }
}

function isDayEntry(value: unknown, date: string): value is DayEntry {
  if (!isRecord(value)) return false
  return (
    value.date === date &&
    Array.isArray(value.results) &&
    value.results.every((result) => isGameResult(result))
  )
}

function validateAppData(value: unknown): AppData {
  if (!isRecord(value) || typeof value.version !== "number" || !isRecord(value.entries)) {
    throw new Error("Invalid backup")
  }
  if (value.version !== SUPPORTED_VERSION) throw new Error("Unsupported backup version")

  for (const [date, entry] of Object.entries(value.entries)) {
    if (!isDayEntry(entry, date)) throw new Error("Invalid backup")
  }

  return value as unknown as AppData
}

export function exportBackup(data: AppData): string {
  return `${BACKUP_PREFIX}${JSON.stringify(data)}`
}

export function importBackup(backup: string): AppData {
  const trimmed = backup.trim()
  const json = trimmed.startsWith(BACKUP_PREFIX) ? trimmed.slice(BACKUP_PREFIX.length) : trimmed

  try {
    return validateAppData(JSON.parse(json) as unknown)
  } catch (error) {
    if (error instanceof Error && error.message === "Unsupported backup version") throw error
    throw new Error("Invalid backup")
  }
}

export function mergeAppData(current: AppData, imported: AppData): AppData {
  const entries = { ...current.entries }

  for (const [date, importedEntry] of Object.entries(imported.entries)) {
    const currentEntry = entries[date]
    if (!currentEntry) {
      entries[date] = importedEntry
      continue
    }

    const results = [...currentEntry.results]
    for (const importedResult of importedEntry.results) {
      const index = results.findIndex((result) => result.gameType === importedResult.gameType)
      if (index >= 0) results[index] = importedResult
      else results.push(importedResult)
    }
    entries[date] = { date, results }
  }

  return { version: SUPPORTED_VERSION, entries }
}

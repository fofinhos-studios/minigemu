import {
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  CircleIcon,
  FishIcon,
  GameControllerIcon,
  GlobeIcon,
  JoystickIcon,
  LightbulbIcon,
  MaskHappyIcon,
  SparkleIcon,
  StarIcon,
  TrophyIcon,
  WavesIcon,
  XIcon,
} from "@phosphor-icons/react"
import { industrialCopy } from "@/design-system/copy"
import { ScrollRegion } from "@/design-system/primitives"
import { isManualLoss, tokenizeGrid } from "@/design-system/result-presentation"
import { useI18n } from "@/i18n/I18nProvider"
import { KRILLION_TIERS, type KrillionTier } from "@/lib/krillion"
import type { GameResult } from "@/types/games"

const symbols = {
  check: CheckIcon,
  cross: XIcon,
  hint: LightbulbIcon,
  camera: CameraIcon,
  game: GameControllerIcon,
  joystick: JoystickIcon,
}
const tierIcons: Record<KrillionTier, typeof StarIcon> = {
  miss: XIcon,
  plankton: CircleIcon,
  tooClever: MaskHappyIcon,
  schooler: FishIcon,
  rare: WavesIcon,
  deepCut: SparkleIcon,
  krillion: StarIcon,
}

export function GridRows({ rows, label }: { rows: string[]; label: string }) {
  return (
    <ScrollRegion className="result-grid" label={`${label}: ${rows.join("\n")}`}>
      {rows.map((row, index) => (
        <div className="result-row" key={index} aria-hidden="true">
          {tokenizeGrid(row).map((token, tokenIndex) => {
            if (!token.color) return <span key={tokenIndex}>{token.text}</span>
            const Icon = token.symbol ? symbols[token.symbol] : null
            return (
              <span
                key={tokenIndex}
                className="result-cell"
                data-shape={token.shape}
                style={{ background: `var(--cell-${token.color})` }}
              >
                {Icon && <Icon weight="bold" />}
              </span>
            )
          })}
        </div>
      ))}
    </ScrollRegion>
  )
}

export function ResultGrid({ result }: { result: GameResult }) {
  const { locale } = useI18n()
  const copy = industrialCopy[locale]
  if (isManualLoss(result)) return null
  if (result.gameType === "crosstune") {
    return result.flawless ? <p className="mt-3 font-mono text-xs">{copy.flawless}</p> : null
  }
  if (result.gameType === "chartle") {
    return (
      <div className="mt-4">
        <p className="mb-2 text-sm">{result.chartTitle}</p>
        <GridRows rows={result.grid} label={copy.grid} />
      </div>
    )
  }
  if (result.gameType === "gamedle" || result.gameType === "termo") {
    return (
      <div className="ticket-modes">
        {result.modes.map((mode, index) => (
          <div key={`${mode.mode}-${index}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
              <span className="font-bold">{mode.mode}</span>
            </div>
            <GridRows
              rows={Array.isArray(mode.grid) ? mode.grid : [mode.grid]}
              label={`${copy.grid} / ${mode.mode}`}
            />
            {"streak" in mode && mode.streak > 0 && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {copy.streak}: {mode.streak}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }
  if (result.gameType === "krillion") {
    return (
      <ol className="mt-3">
        {result.tiers.map((tier, index) => {
          const Icon = tierIcons[tier]
          return (
            <li key={index} className="result-round">
              <span className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon size={18} aria-hidden="true" />
                {KRILLION_TIERS[tier].label}
              </span>
              <span className="font-mono">{KRILLION_TIERS[tier].points} pts</span>
            </li>
          )
        })}
      </ol>
    )
  }
  if (result.gameType === "timeguessr") {
    return (
      <ol className="mt-3">
        {result.rounds.map((round, index) => (
          <li key={index} className="result-round flex-wrap">
            <span className="font-mono text-muted-foreground">
              {copy.round} {index + 1}
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono">
              <span className="flex items-center gap-1">
                <TrophyIcon size={16} aria-hidden="true" />
                <span className="sr-only">{copy.points}: </span>
                {round.score.toLocaleString(locale)}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon size={16} aria-hidden="true" />
                <span className="sr-only">{copy.yearError}: </span>
                {round.yearError} {copy.years}
              </span>
              <span className="flex items-center gap-1">
                <GlobeIcon size={16} aria-hidden="true" />
                <span className="sr-only">{copy.distance}: </span>
                {round.distance.toLocaleString(locale)} {round.distanceUnit}
              </span>
            </div>
          </li>
        ))}
      </ol>
    )
  }
  if (result.gameType === "sizeitup") {
    return (
      <ol className="mt-3">
        {result.grid.map((row, index) => (
          <li key={index} className="result-round">
            <span className="font-mono text-muted-foreground">
              {copy.round} {index + 1}
            </span>
            <GridRows rows={[row]} label={`${copy.round} ${index + 1}`} />
          </li>
        ))}
      </ol>
    )
  }
  return (
    <div className="mt-4">
      <GridRows rows={result.grid} label={copy.grid} />
    </div>
  )
}

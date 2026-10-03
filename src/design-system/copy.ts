import type { Locale } from "@/i18n/strings"

const en = {
  cancel: "Cancel",
  won: "Completed",
  lost: "Not completed",
  attempts: "Attempts",
  edition: "Edition",
  points: "Points",
  ratio: "Ratio",
  modes: "Modes",
  manual: "Manual loss",
  result: "Result",
  hints: "Hints",
  round: "Round",
  streak: "Streak",
  grid: "Result grid",
  close: "Close",
  catalog: "Design system",
}
type Copy = { [K in keyof typeof en]: string }
export const industrialCopy: Record<Locale, Copy> = {
  en,
  "pt-BR": {
    cancel: "Cancelar",
    won: "Concluído",
    lost: "Não concluído",
    attempts: "Tentativas",
    edition: "Edição",
    points: "Pontos",
    ratio: "Proporção",
    modes: "Modos",
    manual: "Derrota manual",
    result: "Resultado",
    hints: "Dicas",
    round: "Rodada",
    streak: "Sequência",
    grid: "Grade do resultado",
    close: "Fechar",
    catalog: "Design system",
  },
}

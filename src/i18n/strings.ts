import type { GameType } from "@/types/games"

export const supportedLocales = ["en", "pt-BR"] as const
export type Locale = (typeof supportedLocales)[number]

type Strings = {
  about: (label: string) => string
  language: string
  languageName: Record<Locale, string>
  switchTheme: (theme: "light" | "dark") => string
  backup: {
    open: string
    dialog: string
    title: string
    description: string
    close: string
    copied: string
    copy: string
    paste: string
    merge: string
    replace: string
    copiedMessage: string
    mergedMessage: string
    replacedMessage: string
    invalid: string
    unsupportedVersion: string
    replaceConfirmation: string
  }
  app: {
    brandSubtitle: string
    todayResults: string
    results: string
    activity: string
    accuracy: string
    pasteResults: string
    supportedGames: string
    supportedGamesTitle: string
    supportedGamesDescription: string
    backToToday: string
    winRates: string
    viewSupportedGames: string
    reviewResults: string
  }
  paste: {
    placeholder: string
    detected: string
    add: string
    added: (count: number) => string
    replaced: (count: number) => string
    noGamesDetected: string
  }
  share: {
    title: string
    gameNamesOnly: string
    gameNamesOnlyHint: string
    copied: string
    copy: string
    copyHint: string
  }
  filter: {
    title: string
    allGames: string
    selected: string
    count: (count: number) => string
    remove: (game: string) => string
  }
  results: {
    emptyToday: string
    emptyDay: string
    paste: string
    reorder: string
    moveUp: (game: string) => string
    moveDown: (game: string) => string
    remove: (game: string) => string
    removeHint: (game: string) => string
    removeConfirmation: string
    markLossTitle: string
    markLossHint: string
    markLoss: (game: string) => string
    overallScore: (score: number) => string
  }
  stats: {
    empty: string
    best: (count: number) => string
    streak: (count: number) => string
    winRate: (game: string, rate: number) => string
    gamesOnDate: (date: string, count: number) => string
    accuracyOnDate: (date: string, rate: number | null) => string
    less: string
    more: string
  }
  help: {
    pasteResults: string
    share: string
    winRates: string
    activity: string
    accuracy: string
  }
  gameDescriptions: Record<GameType, string>
}

export const strings: Record<Locale, Strings> = {
  en: {
    about: (label) => `About ${label}`,
    language: "Language",
    languageName: { en: "English", "pt-BR": "Português (Brasil)" },
    switchTheme: (theme) => `Switch to ${theme} mode`,
    backup: {
      open: "Backup or restore progress",
      dialog: "Backup progress",
      title: "Backup progress",
      description: "Copy your backup string or paste one to restore progress.",
      close: "Close backup",
      copied: "Copied",
      copy: "Copy backup string",
      paste: "Paste backup string here...",
      merge: "Merge backup",
      replace: "Replace progress",
      copiedMessage: "Backup copied",
      mergedMessage: "Backup merged",
      replacedMessage: "Progress replaced",
      invalid: "Invalid backup",
      unsupportedVersion: "Unsupported backup version",
      replaceConfirmation: "Replace all current progress with this backup? This cannot be undone.",
    },
    app: {
      brandSubtitle: "daily game\ntracker",
      todayResults: "Today",
      results: "Results",
      activity: "Activity",
      accuracy: "Accuracy",
      pasteResults: "Paste Results",
      supportedGames: "Supported Games",
      supportedGamesTitle: "Supported Games",
      supportedGamesDescription: "View supported games and open their websites",
      backToToday: "Back to today",
      winRates: "Win Rates",
      viewSupportedGames: "Close supported games",
      reviewResults: "Review results recorded for the selected day",
    },
    paste: {
      placeholder: "Paste your game results here...",
      detected: "Detected:",
      add: "Add",
      added: (count) => `${count} game${count === 1 ? "" : "s"} added`,
      replaced: (count) => `${count} replaced`,
      noGamesDetected: "No games detected in pasted text",
    },
    share: {
      title: "Share",
      gameNamesOnly: "Game names only",
      gameNamesOnlyHint: "Replace original game headers with game names",
      copied: "Copied!",
      copy: "Copy message",
      copyHint: "Copy the combined results message to your clipboard",
    },
    filter: {
      title: "Filter results, activity, accuracy, and win rates by game",
      allGames: "All games",
      selected: "Selected game filters",
      count: (count) => `${count} game filter${count === 1 ? "" : "s"}`,
      remove: (game) => `Remove ${game} filter`,
    },
    results: {
      emptyToday: "No games recorded today",
      emptyDay: "No games recorded for this day",
      paste: "Paste a result",
      reorder: "Reorder result",
      moveUp: (game) => `Move ${game} up`,
      moveDown: (game) => `Move ${game} down`,
      remove: (game) => `Remove ${game}`,
      removeHint: (game) => `Remove ${game} from this day`,
      removeConfirmation: "Remove this result?",
      markLossTitle: "Mark a game as lost",
      markLossHint: "Use this when a game has no result to paste",
      markLoss: (game) => `Record ${game} as a loss`,
      overallScore: (score) => `Score: ${score}/500`,
    },
    stats: {
      empty: "Stats will appear after you add some games",
      best: (count) => `Best: ${count}`,
      streak: (count) => `${count} streak`,
      winRate: (game, rate) => `${game} win rate: ${rate}%`,
      gamesOnDate: (date, count) => `${date}: ${count} game${count === 1 ? "" : "s"}`,
      accuracyOnDate: (date, rate) =>
        rate === null ? `${date}: no games` : `${date}: ${rate}% accuracy`,
      less: "Less",
      more: "More",
    },
    help: {
      pasteResults:
        "Paste shared results from supported games. Recognized results are added automatically to their game date.",
      share:
        "Preview and copy today's combined results. Enable Game names only for a shorter message without original headers.",
      winRates:
        "Each game shows its recorded daily win rate and streak. Indented modes show their own results. Manual losses count toward the game total without adding a result to a specific mode.",
      activity:
        "Shows how many games you recorded each day. Hover a square for details or select it to open that date.",
      accuracy:
        "Shows daily win percentage. Red means fewer wins; green means higher accuracy. Select a day to review it.",
    },
    gameDescriptions: {
      anthropeum: "Guess where and when ten artifacts were made",
      conexo: "Group words by connection",
      cutle: "Cut a shape into equal halves; 48:52 or better wins",
      expresso: "Find the popular expression",
      framed: "Guess the movie from frames",
      gamedle: "Guess the game from clues",
      guessthegame: "Guess the game from screenshots",
      krillion: "Find rare answers in seven prompts",
      letroso: "Brazilian word puzzle",
      sizeitup: "Estimate sizes in five rounds",
      termo: "Portuguese Wordle",
      timeguessr: "Guess the year and location of historical photos",
      zoomout: "Guess the game as a screenshot zooms out",
    },
  },
  "pt-BR": {
    about: (label) => `Sobre ${label}`,
    language: "Idioma",
    languageName: { en: "English", "pt-BR": "Português (Brasil)" },
    switchTheme: (theme) => `Alternar para o modo ${theme === "dark" ? "escuro" : "claro"}`,
    backup: {
      open: "Fazer backup ou restaurar o progresso",
      dialog: "Backup do progresso",
      title: "Backup do progresso",
      description: "Copie sua sequência de backup ou cole uma para restaurar o progresso.",
      close: "Fechar backup",
      copied: "Copiado",
      copy: "Copiar sequência de backup",
      paste: "Cole a sequência de backup aqui...",
      merge: "Mesclar backup",
      replace: "Substituir progresso",
      copiedMessage: "Backup copiado",
      mergedMessage: "Backup mesclado",
      replacedMessage: "Progresso substituído",
      invalid: "Backup inválido",
      unsupportedVersion: "Versão de backup não suportada",
      replaceConfirmation:
        "Substituir todo o progresso atual por este backup? Esta ação não pode ser desfeita.",
    },
    app: {
      brandSubtitle: "jogos\ndiários",
      todayResults: "Hoje",
      results: "Resultados",
      activity: "Atividade",
      accuracy: "Precisão",
      pasteResults: "Colar resultados",
      supportedGames: "Jogos compatíveis",
      supportedGamesTitle: "Jogos compatíveis",
      supportedGamesDescription: "Veja os jogos compatíveis e abra seus sites",
      backToToday: "Voltar para hoje",
      winRates: "Taxas de vitória",
      viewSupportedGames: "Fechar jogos compatíveis",
      reviewResults: "Revise os resultados registrados para o dia selecionado",
    },
    paste: {
      placeholder: "Cole os resultados dos seus jogos aqui...",
      detected: "Detectado:",
      add: "Adicionar",
      added: (count) =>
        `${count} jogo${count === 1 ? "" : "s"} adicionado${count === 1 ? "" : "s"}`,
      replaced: (count) => `${count} substituído${count === 1 ? "" : "s"}`,
      noGamesDetected: "Nenhum jogo foi detectado no texto colado",
    },
    share: {
      title: "Compartilhar",
      gameNamesOnly: "Somente nomes dos jogos",
      gameNamesOnlyHint: "Substitua os cabeçalhos originais pelos nomes dos jogos",
      copied: "Copiado!",
      copy: "Copiar mensagem",
      copyHint: "Copie a mensagem combinada de resultados para a área de transferência",
    },
    filter: {
      title: "Filtre resultados, atividade, precisão e taxas de vitória por jogo",
      allGames: "Todos os jogos",
      selected: "Filtros de jogos selecionados",
      count: (count) => `${count} filtro${count === 1 ? "" : "s"} de jogo`,
      remove: (game) => `Remover filtro de ${game}`,
    },
    results: {
      emptyToday: "Nenhum jogo registrado hoje",
      emptyDay: "Nenhum jogo registrado neste dia",
      paste: "Colar um resultado",
      reorder: "Reordenar resultado",
      moveUp: (game) => `Mover ${game} para cima`,
      moveDown: (game) => `Mover ${game} para baixo`,
      remove: (game) => `Remover ${game}`,
      removeHint: (game) => `Remover ${game} deste dia`,
      removeConfirmation: "Remover este resultado?",
      markLossTitle: "Marcar um jogo como perdido",
      markLossHint: "Use esta opção quando um jogo não tiver um resultado para colar",
      markLoss: (game) => `Registrar ${game} como derrota`,
      overallScore: (score) => `Pontuação: ${score}/500`,
    },
    stats: {
      empty: "As estatísticas aparecerão depois que você adicionar alguns jogos",
      best: (count) => `Melhor: ${count}`,
      streak: (count) => `${count} sequência`,
      winRate: (game, rate) => `Taxa de vitória de ${game}: ${rate}%`,
      gamesOnDate: (date, count) => `${date}: ${count} jogo${count === 1 ? "" : "s"}`,
      accuracyOnDate: (date, rate) =>
        rate === null ? `${date}: nenhum jogo` : `${date}: ${rate}% de precisão`,
      less: "Menos",
      more: "Mais",
    },
    help: {
      pasteResults:
        "Cole resultados compartilhados dos jogos compatíveis. Os resultados reconhecidos são adicionados automaticamente à data do jogo.",
      share:
        "Visualize e copie os resultados combinados de hoje. Ative Somente nomes dos jogos para uma mensagem menor, sem os cabeçalhos originais.",
      winRates:
        "Cada jogo mostra a taxa de vitória e a sequência dos resultados diários registrados. Os modos recuados mostram seus próprios resultados. Derrotas manuais contam no total do jogo sem adicionar um resultado a um modo específico.",
      activity:
        "Mostra quantos jogos você registrou por dia. Passe o cursor sobre um quadrado para ver detalhes ou selecione-o para abrir a data.",
      accuracy:
        "Mostra a porcentagem diária de vitórias. Vermelho indica menos vitórias; verde, maior precisão. Selecione um dia para revisá-lo.",
    },
    gameDescriptions: {
      anthropeum: "Adivinhe onde e quando dez artefatos foram feitos",
      conexo: "Agrupe palavras pela conexão",
      cutle: "Corte uma forma ao meio; 48:52 ou melhor é vitória",
      expresso: "Encontre a expressão popular",
      framed: "Adivinhe o filme pelos quadros",
      gamedle: "Adivinhe o jogo pelas pistas",
      guessthegame: "Adivinhe o jogo pelas capturas de tela",
      krillion: "Encontre respostas raras em sete perguntas",
      letroso: "Jogo brasileiro de palavras",
      sizeitup: "Estime tamanhos em cinco rodadas",
      termo: "Wordle em português",
      timeguessr: "Adivinhe o ano e o local de fotos históricas",
      zoomout: "Adivinhe o jogo conforme a imagem se afasta",
    },
  },
}

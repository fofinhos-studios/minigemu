# Minigēmu Industrial

An operational dashboard built around boarding-pass results. Black and white establish hierarchy; pastel neon identifies games. Gameplay colors remain independent from game identity.

## Where to edit

| Concern | Source |
| --- | --- |
| Colors, spacing, type, borders, layers, motion and responsive recipes | `src/design-system/theme.css` |
| Game codes, outline marks and references to color tokens | `src/design-system/games.ts` |
| Shared UI components | `src/design-system/primitives.tsx` |
| Display-only result interpretation | `src/design-system/result-presentation.ts` and `ResultGrid.tsx` |
| New PT/EN interface copy | `src/design-system/copy.ts` |
| Fonts and licenses | `public/fonts` and generated `fonts.css` |

The theme stylesheet is the authority for visual values. Its commented sections can become separate modules without changing consumer names. Do not redefine colors inside components or create another map of game colors. Tailwind handles local layout; shared recipes handle appearance and interaction.

## Foundations

- Archivo 400/600/700: body, controls, and the bold Latin wordmark. Chakra Petch 500/700: headings and ticket numbers. Spline Sans Mono 400/500: dates and metadata, with compact proportions and distinctive ink traps. Noto Sans JP 700: Japanese type specimens in the catalog.
- All fonts are served locally with `font-display: swap`. `python scripts/fetch_fonts.py` refreshes Latin/Latin Extended subsets, the Japanese catalog specimen subset, and OFL licenses. Identical font URLs are downloaded once. If the Japanese sample text changes, update the subset query too.
- Body 14–16 px, metadata 12 px, headings 24–40 px, ticket metrics 38 px. Uppercase is reserved for short labels.
- Rectangular surfaces, 1 px rules, 2 px ticket boundaries and dashed perforation. Tickets have no resting shadow, preserving both notch openings; pointer hover adds a soft shadow using `--ticket-hover-shadow`. Other raised surfaces use short, hard shadows. Pastel backgrounds always use black ink.
- Light theme starts with gray paper, white surfaces and black text. Dark theme uses black background, charcoal surfaces and white text. Use semantic tokens rather than conditionals on component colors.
- Game text uses `--game-*-ink`; colored areas use `--game-*` with `--color-ink`. Names and distinct symbols accompany every game color.

## Components and interaction

Keep interface copy functional: game names, metric units, dates, actions and state messages. Avoid slogans, generic dashboard introductions, repeated brand/year stamps and instructions that duplicate the adjacent control. Put extended guidance in contextual help. Remove the associated layout space when removing text.

Use `Button` variants (`primary`, `secondary`, `danger`, `ghost`), `Panel`, `TextArea`, `Label`, `Message`, `Tabs`, `Dialog`, and `ScrollRegion`. Labels are semantic content; buttons retain native HTML behavior and accessible names. Tabs support arrows/Home/End. Dialogs trap focus, close on Escape, restore focus, and lock background scrolling. Scrollable result/text regions remain keyboard accessible.

Ticket actions belong in one header group: move up, move down, then delete. Keep the reorder fieldset and accessible names, disabled boundary states, and 44 px targets. The group can wrap below a long title on narrow screens; do not add a separate action footer.

The results view puts manual-loss entry before its tickets. Win rates have their own tab in the second position after results, alongside activity and accuracy, and use the same game filter. Tabs form two columns on mobile. Statistics use a game row followed by an indented nested list of its modes; show mode names without repeating the game name, while retaining full accessible labels on progress bars. Parent rates use the stored daily game outcome; children use only their own recorded mode outcomes. A manual loss affects the parent and does not invent losses for unrecorded modes.

Phosphor defaults come from IconContext: bold outlines, currentColor, no duotone. Custom game marks use a 32-unit grid with a 2-unit stroke and no fill. Keep the marks recognizable at 16–48 px.

The workspace is at most 1440 px, two columns from 1024 px. On smaller screens, input precedes results and sharing. At 640 px, ticket stubs move from the side to the top. Wide gameplay rows scroll within the ticket rather than changing their grouping or causing page overflow.

Hover lifts tickets by 2 px with 1.015 scale and a soft shadow; primary interactive surfaces use 1.03 scale. Press uses .97. Durations are 160–240 ms with the shared easing; ticket entry is 280 ms. Only devices with pointer hover get ticket elevation. Reduced motion disables animation, transitions and transforms while retaining the static hover shadow.

The shared `Wordmark` uses an 1800 ms lilac edge shimmer on entry and pointer re-entry. A masked decorative outline layer sweeps over the unchanged text and symbol, then fades completely. Its duration and glow color are tokens in `theme.css`. The layer is hidden from assistive technology, ignores pointer input, and is removed under reduced motion. It does not loop; the catalog includes the same component on a black preview surface.

## Result integrity

Every ticket reserves the large figures beneath its title for performance (points or attempts, with units). Multi-mode games list attempts per mode in this same area. Edition identifiers live in the colored stub, with mode names where needed; omit the entire edition field when unavailable, including unknown editions among otherwise numbered modes. Keep this content accessible to screen readers. On mobile, editions follow the identity within the top strip. Dates belong to the surrounding day view, not individual cards. Never substitute an edition or a mode count for a score. Guess counts can be read from played cells; Termo keeps explicit attempts or board keycaps, falling back to played rows. These are display-only interpretations.

`GameResult`, localStorage, parsers, win calculations and share generation remain the data authority. The new renderer does not write transformed grids back to storage. It tokenizes by grapheme, retains unknown symbols and whitespace, separates game modes, and displays scoring rounds from existing data. Zero-point completed games remain completed; manual losses omit sentinel metrics.

Add a game's identity to the typed registry and CSS palette, then validate its result renderer and catalog sample. Domain/parser changes remain a separate concern.

## Catalog and verification

Run `bun run dev` and open `/?design-system`. The catalog is lazy-loaded only in development and is omitted from production builds. Its controls, tickets, dialogs, paste area, copy action and heatmaps are real components. Samples and mutations stay in component state; language and theme do not overwrite saved preferences.

Inspect both themes at 360, 768, 1024 and 1440 px in PT and EN. Exercise focus, hover, active, disabled, empty, error, filtering, manual loss, reorder, copy, history and backup confirmation states. Check actual surface contrast, not token values alone. Then run `bun run lint`, `bun run typecheck`, `bun test`, and `bun run build`.

Presentation tests cover all supported games, unchanged sharing/data, manual losses, zero scores, unknown graphemes, multiple modes and side-by-side boards. Existing parser and backup tests remain in place.

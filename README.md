# Hot Wheels Rekenspel

Een rekenspel voor groep 4 met Hot Wheels-thema. Maak timed sommen, verdien Wheel Credits, koop auto's en upgrades, en race over de baan!

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Tests

```bash
pnpm test
```

## Build

```bash
pnpm build
pnpm preview
```

## Structuur

- `config/` — levels, auto's, upgrades, banen, scoring (JSON)
- `docs/knowledge-base/` — spelregels en curriculum
- `src/` — React app met quiz, shop, race-simulatie
- `tests/` — Vitest unit tests

## Spelregels

- 10 sommen per ronde met variabele tijd per somsoort
- Punten → Wheel Credits → auto's/upgrades
- Race-uitkomst is deterministisch op basis van auto-stats + baan
- Voortgang wordt opgeslagen in `localStorage`

Hot Wheels hobbyproject met officiële Mattel-branding (eigen gebruik).

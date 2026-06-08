# Hot Wheels thema

Hobbyproject voor eigen gebruik met **officiële Hot Wheels/Mattel-branding**.

## Branding-beleid

- Officieel Hot Wheels-logo op title screen en favicon
- Mattel-kleuren (Pantone → hex) in CSS tokens
- Wheel Credits-icoon afgeleid van officiële flame-wheel
- Assets lokaal in `public/assets/brand/`

## UI-termen

- **Wheel Credits** — punten uit rekenen
- **Garage** — verzameling auto's
- **Booster Shop** — winkel na elke ronde
- **Race Portal** — start van de race

## Baanonderdelen

| Segment  | Effect                           |
| -------- | -------------------------------- |
| straight | Acceleratie naar topsnelheid     |
| curve    | Grip + handling nodig            |
| booster  | Motorized wheels, snelheidsboost |
| loop     | Min. entry speed + grip          |
| jump     | Min. snelheid, max. gewicht      |
| rocket   | Vereist Baan Blaster upgrade     |

## Kleuren (officiële Mattel-waarden)

| Token             | Hex       | Pantone    |
| ----------------- | --------- | ---------- |
| Flame red         | `#DA291C` | PMS 485 C  |
| Hot Wheels yellow | `#FFE600` | PMS 116 C  |
| Brand blue        | `#0072CE` | PMS 285 C  |
| Light blue        | `#009CDE` | PMS 2925 C |
| Track orange      | `#FF6B00` | —          |
| Track highlight   | `#FF8C33` | —          |
| Flame hot         | `#FF2D00` | —          |
| Dark ink          | `#1A1A2E` | —          |

## Typografie

- **Display/titels:** Rajdhani Bold Italic (Google Fonts)
- **Body/vragen:** Fredoka SemiBold (Google Fonts)
- **Logo:** officieel SVG-wordmark (`HotWheelsLogo` component)

## Assets

```
public/assets/
├── brand/          # hot-wheels-logo, wheel, flame, mattel
├── icons/          # segment-iconen, wheel-credit, trophy, vlag
├── cars/           # 5 auto-illustraties (per carId)
├── decor/          # speed-lines, loop-arch, garage-floor
└── backgrounds/    # sky-gradient
```

## Auto-stats

speed, acceleration, handling, grip, boost, weight (lager = beter bij sprongen)

Stat-kleuren in UI: snelheid=rood, grip=groen, boost=paars, handling=blauw

## Animaties

- Correct antwoord: groene burst (`hw-burst`)
- Fout antwoord: zachte rode pulse (`hw-pulse-red`)
- Scherm-transitie: fade-in (`hw-fade-in`)
- Win screen: checkered wipe

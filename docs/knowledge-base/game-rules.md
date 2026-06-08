# Spelregels

## Spelloop

1. **10 timed sommen** per ronde
2. **Shop** — Wheel Credits uitgeven aan auto's of upgrades (per auto)
3. **Auto kiezen** — één auto voor de race
4. **Race** — deterministische simulatie; zichtbaar op canvas
5. **Resultaat** — gehaald = level omhoog; mis = zelfde level, nieuwe ronde

## Punten

```
punten = baseCorrect + floor(timeRemaining / question.timeMs × maxTimeBonus)
```

- Fout of time-out = **0 punten**
- Config: `config/scoring.json`

## Tijd per vraag

```
timeMs = level.baseTimeMs × questionType.timeFactor
```

Geclamped tussen `minTimeMs` en `maxTimeMs`.

| Level | baseTimeMs      |
| ----- | --------------- |
| 1     | 15000           |
| 2     | 14000           |
| …     | −1000 per level |
| 9     | 7000            |

Voorbeeld level 3 (13000 ms basis):

- Tafelsom (factor 0.55) → 7150 ms
- Verhaaltjessom geld (factor 1.35) → 17550 ms → clamp 25000 max

## Opslag

- Key: `hot-wheels-rekenen-save`
- Versie: `1`
- Auto-save na antwoord, shop, race

## Antwoordformaat

- Open getal-antwoord (geen komma's)
- Klok: HHMM (bv. 930 voor 9:30, 1430 voor 14:30)

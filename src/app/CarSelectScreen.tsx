import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "../game/store";
import {
  getCar,
  getCarsConfig,
  getLevel,
  getTrack,
} from "../config/loadConfig";
import { computeEffectiveStats, getUpgradeLevel } from "../garage/stats";
import { getAvailableUpgrades } from "../garage/shop";
import { ScreenShell } from "../ui/ScreenShell";
import { CheckeredFlagIcon } from "../ui/icons";
import {
  CarPreview3D,
  preloadCarPreview,
} from "../race3d/render/CarPreview3D";

const STAT_LABELS: Record<string, string> = {
  speed: "Snelheid",
  grip: "Grip",
  boost: "Boost",
  handling: "Handling",
};

const STAT_KEYS = ["speed", "grip", "boost", "handling"] as const;

export function CarSelectScreen() {
  const level = useGameStore((s) => s.level);
  const credits = useGameStore((s) => s.credits);
  const ownedCars = useGameStore((s) => s.ownedCars);
  const selectCar = useGameStore((s) => s.selectCar);

  const { statMax } = getCarsConfig();
  const levelConfig = getLevel(level);
  const track = getTrack(levelConfig.trackId);
  const recommended = track.recommendedCarId
    ? getCar(track.recommendedCarId)
    : null;

  const [focusedId, setFocusedId] = useState(
    () => ownedCars[0]?.instanceId ?? "",
  );

  const focused =
    ownedCars.find((c) => c.instanceId === focusedId) ?? ownedCars[0];
  const upgrades = getAvailableUpgrades();

  useEffect(() => {
    for (const c of ownedCars) preloadCarPreview(c.carId);
  }, [ownedCars]);

  return (
    <ScreenShell
      variant="garage"
      className="car-select-screen"
      level={level}
      credits={credits}
      badge="Garage"
    >
      <header className="garage-select-header">
        <h2 className="hw-title garage-select-title">Kies je race-auto</h2>
        <p className="garage-select-track">
          <CheckeredFlagIcon size={22} />
          {track.name}
        </p>
        {recommended && (
          <p className="garage-select-tip">
            Tip: <strong>{recommended.name}</strong>
            {track.recommendedCarTip
              ? ` — ${track.recommendedCarTip}`
              : null}
          </p>
        )}
      </header>

      <div className="garage-select-grid">
        {ownedCars.map((instance) => {
          const car = getCar(instance.carId);
          const stats = computeEffectiveStats(instance);
          const isFocused = instance.instanceId === focusedId;
          const isRecommended = car.id === track.recommendedCarId;
          const installedUpgrades = upgrades.filter(
            (u) => getUpgradeLevel(instance, u.id) > 0,
          );

          return (
            <article
              key={instance.instanceId}
              className={`garage-picker-card hw-chrome-border ${isFocused ? "is-focused" : ""} ${isRecommended ? "is-recommended" : ""}`}
            >
              {isRecommended && (
                <span className="garage-picker-badge">Aanbevolen</span>
              )}
              <button
                type="button"
                className="garage-picker-main"
                onClick={() => setFocusedId(instance.instanceId)}
              >
                <div className="garage-picker-visual">
                  <CarPreview3D carId={car.id} />
                </div>
                <div className="garage-picker-body">
                  <h3 className="garage-picker-name hw-display">{car.name}</h3>
                  <p className="garage-picker-desc">{car.description}</p>
                  <div className="garage-picker-stats">
                    {STAT_KEYS.map((key) => (
                      <div key={key} className="garage-stat-row">
                        <span className="garage-stat-label">
                          {STAT_LABELS[key]}
                        </span>
                        <div className="hw-stat-track">
                          <div
                            className={`hw-stat-fill ${key}`}
                            style={{
                              width: `${Math.min(100, (stats[key] / statMax) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="garage-stat-val">{stats[key]}</span>
                      </div>
                    ))}
                  </div>
                  {installedUpgrades.length > 0 && (
                    <ul className="garage-upgrade-pills">
                      {installedUpgrades.map((u) => {
                        const lvl = getUpgradeLevel(instance, u.id);
                        return (
                          <li key={u.id}>
                            {u.name} L{lvl}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {focused && (
        <button
          type="button"
          className="hw-btn hw-btn-primary hw-btn-racing garage-select-cta"
          onClick={() => selectCar(focused.instanceId)}
        >
          Start race
        </button>
      )}
    </ScreenShell>
  );
}

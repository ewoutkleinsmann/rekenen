import { useGameStore } from "../game/store";
import { getCar } from "../config/loadConfig";
import { computeEffectiveStats } from "../garage/stats";
import { ScreenShell } from "../ui/ScreenShell";
import { CarSvg } from "../ui/icons";

const STAT_LABELS: Record<string, string> = {
  speed: "snelheid",
  grip: "grip",
  boost: "boost",
  handling: "handling",
};

const STAT_KEYS = ["speed", "grip", "boost", "handling"] as const;

export function CarSelectScreen() {
  const ownedCars = useGameStore((s) => s.ownedCars);
  const selectCar = useGameStore((s) => s.selectCar);

  return (
    <ScreenShell
      variant="garage"
      className="car-select hw-checkered"
      badge="Garage"
    >
      <h2 className="hw-title" style={{ fontSize: "1.5rem" }}>
        Garage
      </h2>
      <p
        className="hw-subtitle"
        style={{ marginBottom: "1rem", fontSize: "1rem" }}
      >
        Kies je race-auto
      </p>
      {ownedCars.map((instance) => {
        const car = getCar(instance.carId);
        const stats = computeEffectiveStats(instance);
        return (
          <button
            key={instance.instanceId}
            type="button"
            className="hw-car-card garage-car-card"
            onClick={() => selectCar(instance.instanceId)}
          >
            <div className="garage-car-visual">
              <CarSvg carId={car.id} width={150} />
            </div>
            <div className="garage-car-info">
              <strong className="hw-display garage-car-name">{car.name}</strong>
              <p className="garage-car-desc">{car.description}</p>
              {STAT_KEYS.map((key) => (
                <div key={key} className="hw-stat-bar">
                  <span>{STAT_LABELS[key]}</span>
                  <div className="hw-stat-track">
                    <div
                      className={`hw-stat-fill ${key}`}
                      style={{ width: `${stats[key]}%` }}
                    />
                  </div>
                  <span>{stats[key]}</span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </ScreenShell>
  );
}

import { useGameStore } from "../game/store";
import { getCar } from "../config/loadConfig";
import { computeEffectiveStats } from "../garage/stats";

export function CarSelectScreen() {
  const ownedCars = useGameStore((s) => s.ownedCars);
  const selectCar = useGameStore((s) => s.selectCar);

  return (
    <div className="car-select">
      <h2 className="hw-title" style={{ fontSize: "1.5rem" }}>
        Kies je race-auto
      </h2>
      {ownedCars.map((instance) => {
        const car = getCar(instance.carId);
        const stats = computeEffectiveStats(instance);
        return (
          <button
            key={instance.instanceId}
            type="button"
            className="hw-car-card"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => selectCar(instance.instanceId)}
          >
            <strong>{car.name}</strong>
            <p>{car.description}</p>
            {(["speed", "grip", "boost", "handling"] as const).map((key) => (
              <div key={key} className="hw-stat-bar">
                <span>{key}</span>
                <div className="hw-stat-track">
                  <div
                    className="hw-stat-fill"
                    style={{ width: `${stats[key]}%` }}
                  />
                </div>
                <span>{stats[key]}</span>
              </div>
            ))}
          </button>
        );
      })}
    </div>
  );
}

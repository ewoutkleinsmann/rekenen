import { useState } from "react";
import { useGameStore } from "../game/store";
import { getPurchasableCars, getAvailableUpgrades } from "../garage/shop";
import { getUpgradePrice, getUpgradeLevel } from "../garage/stats";
import { getCar } from "../config/loadConfig";

export function ShopScreen() {
  const credits = useGameStore((s) => s.credits);
  const ownedCars = useGameStore((s) => s.ownedCars);
  const roundState = useGameStore((s) => s.roundState);
  const buyCarAction = useGameStore((s) => s.buyCarAction);
  const buyUpgradeAction = useGameStore((s) => s.buyUpgradeAction);
  const finishShop = useGameStore((s) => s.finishShop);
  const [tab, setTab] = useState<"cars" | "upgrades">("cars");
  const [selectedCar, setSelectedCar] = useState(
    ownedCars[0]?.instanceId ?? "",
  );

  const earned = roundState?.creditsThisRound ?? 0;
  const purchasableCars = getPurchasableCars(ownedCars);
  const upgrades = getAvailableUpgrades();
  const carInstance = ownedCars.find((c) => c.instanceId === selectedCar);

  return (
    <div className="shop-screen">
      <h2 className="hw-title" style={{ fontSize: "1.5rem" }}>
        Booster Shop
      </h2>
      <p className="hw-credits" style={{ textAlign: "center" }}>
        +{earned} verdiend! Totaal: 🛞 {credits} Wheel Credits
      </p>
      <div className="hw-tabs">
        <button
          type="button"
          className={`hw-btn hw-btn-secondary ${tab === "cars" ? "active" : ""}`}
          onClick={() => setTab("cars")}
        >
          Nieuwe auto&apos;s
        </button>
        <button
          type="button"
          className={`hw-btn hw-btn-secondary ${tab === "upgrades" ? "active" : ""}`}
          onClick={() => setTab("upgrades")}
        >
          Upgrades
        </button>
      </div>
      {tab === "cars" && (
        <div>
          {purchasableCars.length === 0 && <p>Je hebt alle auto&apos;s!</p>}
          {purchasableCars.map((car) => (
            <div key={car.id} className="hw-car-card">
              <strong>{car.name}</strong>
              <p>{car.description}</p>
              <p className="hw-credits">🛞 {car.price}</p>
              <button
                type="button"
                className="hw-btn hw-btn-primary"
                disabled={credits < car.price}
                onClick={() => buyCarAction(car.id)}
              >
                Kopen
              </button>
            </div>
          ))}
        </div>
      )}
      {tab === "upgrades" && carInstance && (
        <div>
          <label>
            Auto:
            <select
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value)}
              style={{ marginLeft: 8, padding: 8 }}
            >
              {ownedCars.map((c) => (
                <option key={c.instanceId} value={c.instanceId}>
                  {getCar(c.carId).name}
                </option>
              ))}
            </select>
          </label>
          {upgrades.map((up) => {
            const level = getUpgradeLevel(carInstance, up.id);
            const price = getUpgradePrice(carInstance, up.id);
            const maxed = level >= up.maxLevel;
            return (
              <div key={up.id} className="hw-car-card">
                <strong>{up.name}</strong> (lvl {level}/{up.maxLevel})
                <p>{up.description}</p>
                {!maxed && (
                  <>
                    <p className="hw-credits">🛞 {price}</p>
                    <button
                      type="button"
                      className="hw-btn hw-btn-primary"
                      disabled={credits < price}
                      onClick={() => buyUpgradeAction(selectedCar, up.id)}
                    >
                      Upgrade
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="hw-btn hw-btn-primary"
        style={{ width: "100%", marginTop: 16 }}
        onClick={finishShop}
      >
        Naar de race! 🏎️
      </button>
    </div>
  );
}

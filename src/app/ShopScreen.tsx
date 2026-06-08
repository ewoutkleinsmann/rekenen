import { useState } from "react";
import { useGameStore } from "../game/store";
import { getPurchasableCars, getAvailableUpgrades } from "../garage/shop";
import { getUpgradePrice, getUpgradeLevel } from "../garage/stats";
import { getCar } from "../config/loadConfig";
import { ScreenShell } from "../ui/ScreenShell";
import { WheelCreditIcon, CarSvg } from "../ui/icons";

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
    <ScreenShell variant="shop" className="shop-screen" credits={credits}>
      <h2
        className="hw-title"
        style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}
      >
        Booster Shop
      </h2>
      <p className="shop-earned-line">
        <span className="shop-earned">+{earned} verdiend!</span>
        <span className="shop-total">
          Totaal: <WheelCreditIcon size={20} /> {credits} Wheel Credits
        </span>
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
      <div className="shop-shelf hw-chrome-border">
        {tab === "cars" && (
          <div className="shop-car-list">
            {purchasableCars.length === 0 && <p>Je hebt alle auto&apos;s!</p>}
            {purchasableCars.map((car) => (
              <div key={car.id} className="hw-blister-card">
                <div className="blister-visual">
                  <CarSvg carId={car.id} width={130} />
                </div>
                <div className="blister-body">
                  <h3 className="blister-name">{car.name}</h3>
                  <p className="blister-desc">{car.description}</p>
                </div>
                <div className="blister-action">
                  <span className="blister-price">
                    <WheelCreditIcon size={22} />
                    {car.price}
                  </span>
                  <button
                    type="button"
                    className="hw-btn hw-btn-primary"
                    disabled={credits < car.price}
                    onClick={() => buyCarAction(car.id)}
                  >
                    Kopen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "upgrades" && carInstance && (
          <div>
            <label className="shop-upgrade-select">
              Auto:{" "}
              <select
                className="hw-select"
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
              >
                {ownedCars.map((c) => (
                  <option key={c.instanceId} value={c.instanceId}>
                    {getCar(c.carId).name}
                  </option>
                ))}
              </select>
            </label>
            {upgrades.map((up) => {
              const lvl = getUpgradeLevel(carInstance, up.id);
              const price = getUpgradePrice(carInstance, up.id);
              const maxed = lvl >= up.maxLevel;
              return (
                <div key={up.id} className="hw-blister-card hw-blister-upgrade">
                  <div
                    className="blister-body"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <h3 className="blister-name">
                      {up.name}{" "}
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--hw-muted)",
                        }}
                      >
                        (lvl {lvl}/{up.maxLevel})
                      </span>
                    </h3>
                    <p className="blister-desc">{up.description}</p>
                  </div>
                  {!maxed && (
                    <div
                      className="blister-action"
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <span className="blister-price">
                        <WheelCreditIcon size={22} />
                        {price}
                      </span>
                      <button
                        type="button"
                        className="hw-btn hw-btn-primary"
                        disabled={credits < price}
                        onClick={() => buyUpgradeAction(selectedCar, up.id)}
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        className="hw-btn hw-btn-primary hw-btn-racing shop-race-btn"
        onClick={finishShop}
      >
        Naar de race!
      </button>
    </ScreenShell>
  );
}

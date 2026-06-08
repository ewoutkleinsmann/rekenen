import { useEffect } from "react";
import { useGameStore } from "../game/store";
import { TitleScreen } from "./TitleScreen";
import { QuizRound } from "./QuizRound";
import { ShopScreen } from "./ShopScreen";
import { CarSelectScreen } from "./CarSelectScreen";
import { RaceScreen } from "./RaceScreen";
import { ResultScreen } from "./ResultScreen";

export function GameApp() {
  const phase = useGameStore((s) => s.phase);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  switch (phase) {
    case "title":
      return <TitleScreen />;
    case "quiz":
      return <QuizRound />;
    case "shop":
      return <ShopScreen />;
    case "selectCar":
      return <CarSelectScreen />;
    case "race":
      return <RaceScreen />;
    case "result":
      return <ResultScreen />;
    default:
      return <TitleScreen />;
  }
}

import { useEffect } from "react";
import { useGameStore } from "../game/store";
import { audio } from "../audio/audio";
import { MuteToggle } from "../ui/MuteToggle";
import { TitleScreen } from "./TitleScreen";
import { IntroScreen } from "./IntroScreen";
import { QuizRound } from "./QuizRound";
import { ShopScreen } from "./ShopScreen";
import { CarSelectScreen } from "./CarSelectScreen";
import { RaceScreen } from "./RaceScreen";
import { RaceDevScreen } from "./RaceDevScreen";
import { ResultScreen } from "./ResultScreen";

/** Local dev only: open the app with `?devRace=1` (e.g. http://localhost:5173/?devRace=1). */
function isRaceDevMode(): boolean {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("devRace")
  );
}

function renderPhase(phase: string) {
  switch (phase) {
    case "title":
      return <TitleScreen />;
    case "intro":
      return <IntroScreen />;
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

export function GameApp() {
  const phase = useGameStore((s) => s.phase);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    if (!isRaceDevMode()) init();
  }, [init]);

  // Unlock the audio context on the first user gesture (autoplay policy).
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  if (isRaceDevMode()) {
    return <RaceDevScreen />;
  }

  return (
    <>
      <MuteToggle className="hw-mute-fixed" />
      {renderPhase(phase)}
    </>
  );
}

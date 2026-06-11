import { useSyncExternalStore } from "react";
import { audio } from "./audio";

export function useMuted(): boolean {
  return useSyncExternalStore(
    (cb) => audio.subscribe(cb),
    () => audio.isMuted(),
    () => audio.isMuted(),
  );
}

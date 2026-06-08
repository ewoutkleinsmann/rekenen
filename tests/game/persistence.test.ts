import { describe, it, expect, beforeEach } from "vitest";
import {
  createNewSave,
  serializeSave,
  deserializeSave,
  SAVE_KEY,
} from "../../src/game/persistence";

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates valid new save", () => {
    const save = createNewSave("Test");
    expect(save.version).toBe(1);
    expect(save.level).toBe(1);
    expect(save.ownedCars.length).toBe(1);
  });

  it("round-trips serialize/deserialize", () => {
    const save = createNewSave();
    save.credits = 200;
    save.level = 3;
    const raw = serializeSave(save);
    const loaded = deserializeSave(raw);
    expect(loaded.credits).toBe(200);
    expect(loaded.level).toBe(3);
  });

  it("uses correct storage key", () => {
    expect(SAVE_KEY).toBe("hot-wheels-rekenen-save");
  });
});

import { describe, it, expect } from "vitest";
import {
  jumpFailureReason,
  jumpMinSpeed,
  loopMinEntrySpeed,
  requiredGripForCurve,
} from "../../src/race3d/sim/segmentPhysics";

describe("segmentPhysics", () => {
  it("demands more grip when speed increases on the same curve", () => {
    const curve = { type: "curve" as const, radius: 40, angle: 70 };
    const slow = requiredGripForCurve(curve, 40);
    const fast = requiredGripForCurve(curve, 80);
    expect(fast).toBeGreaterThan(slow * 3);
  });

  it("demands higher loop entry speed for smaller radius", () => {
    expect(loopMinEntrySpeed(20)).toBeGreaterThan(loopMinEntrySpeed(28));
  });

  it("demands higher jump speed for longer gaps and heavier cars", () => {
    const light = jumpMinSpeed(40, 40);
    const heavy = jumpMinSpeed(40, 70);
    const short = jumpMinSpeed(30, 50);
    const long = jumpMinSpeed(50, 50);
    expect(heavy).toBeGreaterThan(light);
    expect(long).toBeGreaterThan(short);
  });

  it("reports speed not weight when heavy car lacks landing speed", () => {
    const jump = { type: "jump" as const, length: 90 };
    const msg = jumpFailureReason(
      jump,
      {
        carId: "booster-blaze",
        weight: 55,
        jumpLandingBonus: 0,
        speed: 50,
        acceleration: 50,
        handling: 50,
        grip: 50,
        boost: 50,
        unlocks: [],
      },
      72,
    );
    expect(msg).toContain("snelheid");
    expect(msg).not.toContain("mislukte landing");
  });
});

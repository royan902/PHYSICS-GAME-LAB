import { describe, expect, it } from "vitest";
import {
  applyShot,
  ball,
  createWorld,
  DEFAULT_CONFIG,
  DT,
  HALF_LENGTH,
  HALF_WIDTH,
  POCKETS,
  RADIUS,
  speed,
  stepWorld,
  totals,
} from "../../src/games/billiard/physics";
const ideal = { ...DEFAULT_CONFIG, friction: 0, restitution: 1, cushion: 1 };
describe("Billiard SI analytic oracles (predefined tolerances)", () => {
  it("rotated collision preserves common tangent velocity and vector momentum", () => {
    const nx = Math.cos(0.6),
      nz = Math.sin(0.6),
      tx = -nz,
      tz = nx;
    const a = ball(0, -0.15 * nx, -0.15 * nz),
      b = ball(1, 0, 0);
    a.vx = nx + tx * 0.2;
    a.vz = nz + tz * 0.2;
    b.vx = tx * 0.2;
    b.vz = tz * 0.2;
    const w = createWorld([a, b], ideal);
    for (let i = 0; i < 24; i++) stepWorld(w);
    expect(w.balls[0].vx).toBeCloseTo(tx * 0.2, 9);
    expect(w.balls[0].vz).toBeCloseTo(tz * 0.2, 9);
    expect(w.balls[1].vx).toBeCloseTo(nx + tx * 0.2, 9);
    expect(w.balls[1].vz).toBeCloseTo(nz + tz * 0.2, 9);
    expect(totals(w).px).toBeCloseTo(0.17 * nx + 0.068 * tx, 9);
    expect(totals(w).pz).toBeCloseTo(0.17 * nz + 0.068 * tz, 9);
    expect(totals(w).energy).toBeCloseTo(0.0918, 9);
  });
  it("equal mass elastic collision exchanges velocities, conserves momentum and energy", () => {
    const a = ball(0, -0.15, 0),
      b = ball(1, 0, 0);
    a.vx = 1;
    const w = createWorld([a, b], ideal);
    for (let i = 0; i < 24; i++) stepWorld(w);
    expect(w.balls[0].vx).toBeCloseTo(0, 10);
    expect(w.balls[1].vx).toBeCloseTo(1, 10);
    expect(totals(w).px).toBeCloseTo(0.17, 10);
    expect(totals(w).energy).toBeCloseTo(0.085, 10);
  });
  it.each([0, 0.5, 0.95, 1])(
    "unequal masses with e=%s match independent 1D solution",
    (e) => {
      const a = ball(0, -0.15, 0, 0.1),
        b = ball(1, 0, 0, 0.3);
      a.vx = 1;
      const w = createWorld([a, b], { ...ideal, restitution: e, cushion: e });
      for (let i = 0; i < 24; i++) stepWorld(w);
      expect(w.balls[0].vx).toBeCloseTo((0.1 - e * 0.3) / 0.4, 8);
      expect(w.balls[1].vx).toBeCloseTo(((1 + e) * 0.1) / 0.4, 8);
      expect(totals(w).px).toBeCloseTo(0.1, 8);
      expect(totals(w).energy).toBeLessThanOrEqual(0.05 + 1e-10);
    },
  );
  it("friction stopping distance and time match v²/2μg and v/μg", () => {
    const a = ball(0, -0.8, 0.2);
    a.vx = 0.5;
    const w = createWorld([a], { ...DEFAULT_CONFIG, friction: 0.04 });
    let ticks = 0;
    while (speed(w.balls[0]) > 0 && ticks < 1000) {
      stepWorld(w);
      ticks++;
    }
    expect(
      Math.abs(w.balls[0].x + 0.8 - 0.25 / (2 * 0.04 * 9.81)),
    ).toBeLessThan(0.005);
    expect(Math.abs(ticks * DT - 0.5 / (0.04 * 9.81))).toBeLessThan(DT);
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(speed(w.balls[0])).toBe(0);
  });
  it("cushion normal restitution is 0.8 without energy injection", () => {
    const a = ball(0, 1.15, 0.2);
    a.vx = 2;
    const w = createWorld([a], { ...ideal, cushion: 0.8 });
    for (let i = 0; i < 12; i++) stepWorld(w);
    expect(w.balls[0].vx).toBeCloseTo(-1.6, 8);
  });
  it("swept discs cannot tunnel through each other at max shot speed", () => {
    const a = ball(0, -0.06, 0),
      b = ball(1, 0.06, 0);
    a.vx = 5;
    b.vx = -5;
    const w = createWorld([a, b], ideal);
    for (let i = 0; i < 4; i++) stepWorld(w);
    expect(w.balls[0].vx).toBe(-5);
    expect(w.balls[1].vx).toBe(5);
  });
  it("max speed sweep at 360 angles stays within table or is pocketed", () => {
    for (let angle = 0; angle < 360; angle++) {
      const a = ball(0, 0, 0);
      applyShot(a, (angle * Math.PI) / 180, 100);
      const w = createWorld([a], ideal);
      for (let i = 0; i < 360; i++) {
        stepWorld(w);
        const b = w.balls[0];
        if (b.active) {
          expect(Math.abs(b.x)).toBeLessThanOrEqual(HALF_LENGTH + 1e-6);
          expect(Math.abs(b.z)).toBeLessThanOrEqual(HALF_WIDTH + 1e-6);
        }
      }
      expect(w.eventLimitHits).toBe(0);
    }
  });
  it("all six pockets capture once and remove ball from solver", () => {
    for (const p of POCKETS) {
      const a = ball(0, p.x * 0.8, p.z * 0.8);
      const d = Math.hypot(p.x - a.x, p.z - a.z);
      a.vx = ((p.x - a.x) / d) * 5;
      a.vz = ((p.z - a.z) / d) * 5;
      const w = createWorld([a], ideal);
      let events = 0;
      for (let i = 0; i < 120; i++) {
        stepWorld(w);
        events += w.pockets.length;
      }
      expect(events).toBe(1);
      expect(w.balls[0].active).toBe(false);
    }
  });
  it("HUD impulse equals actual shot and no invalid inputs", () => {
    const a = ball(0, 0, 0);
    const result = applyShot(a, 0, 40)!;
    expect(result.velocity).toBe(2);
    expect(result.impulse).toBeCloseTo(0.34, 12);
    expect(result.energy).toBeCloseTo(0.34, 12);
    expect(applyShot(a, 0, 40)).toBeNull();
    expect(applyShot(ball(0, 0, 0), NaN, 40)).toBeNull();
    expect(() => createWorld([], { ...ideal, mass: NaN })).toThrow();
    expect(RADIUS).toBeGreaterThan(0);
  });
});

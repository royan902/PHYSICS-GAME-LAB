import { expect, it } from "vitest";
import {
  applyShot,
  ball,
  createWorld,
  DEFAULT_CONFIG,
  DT,
  RADIUS,
  shotMetrics,
  stepWorld,
  totals,
} from "../../src/games/billiard/physics";
const ideal = { ...DEFAULT_CONFIG, friction: 0, restitution: 1, cushion: 1 };
it("noncentral impulse obeys r cross J and solid sphere inertia", () => {
  const b = ball(0, 0, 0);
  applyShot(b, 0, 40, { side: 0, top: 1, elevation: 0 });
  expect(b.wz).toBeCloseTo((-3.2 * 0.65) / (0.4 * RADIUS), 10);
  expect(b.wx).toBe(0);
  expect(totals(createWorld([b], ideal)).energy).toBeCloseTo(
    0.5 * 0.17 * 3.2 ** 2 + 0.5 * (0.4 * 0.17 * RADIUS ** 2) * b.wz ** 2,
    10,
  );
});
it("jump matches ballistic apex within 2 mm, low elevation stays grounded and landing settles", () => {
  const b = ball(0, -0.7, 0);
  const shot = { side: 0, top: 0, elevation: 65 };
  const m = applyShot(b, 0, 40, shot)!;
  const w = createWorld([b], { ...DEFAULT_CONFIG, friction: 0.05 });
  let apex = RADIUS;
  for (let i = 0; i < 360; i++) {
    stepWorld(w);
    apex = Math.max(apex, w.balls[0].y);
  }
  const expected =
    (3.2 * Math.sin((65 * Math.PI) / 180) * 0.35) ** 2 / (2 * 9.81);
  expect(Math.abs(apex - RADIUS - expected)).toBeLessThan(0.002);
  expect(m.height).toBeCloseTo(expected, 12);
  expect(w.balls[0].y).toBeCloseTo(RADIUS, 8);
  expect(w.balls[0].vy).toBe(0);
  expect(shotMetrics(10, 0.17, { side: 0, top: 0, elevation: 5 }).height).toBe(
    0,
  );
});
it("airborne ball clears a low ball without planar false collision; 3D collision conserves vector momentum", () => {
  const a = ball(0, -0.1, 0),
    b = ball(1, 0, 0);
  a.y = 0.2;
  a.vx = 3;
  const w = createWorld([a, b], ideal);
  for (let i = 0; i < 8; i++) stepWorld(w);
  expect(w.balls[1].vx).toBe(0);
  const c = ball(0, -0.08, 0),
    d = ball(1, 0, 0);
  c.y = d.y = 0.25;
  c.vx = 2;
  c.vy = d.vy = 1;
  const v = createWorld([c, d], ideal);
  const initial = totals(v);
  for (let i = 0; i < 4; i++) stepWorld(v);
  expect(totals(v).px).toBeCloseTo(initial.px, 9);
  expect(totals(v).py).toBeCloseTo(initial.py - 0.34 * 9.81 * 4 * DT, 9);
  expect(v.balls[1].vx).toBeCloseTo(2, 8);
});
it("backspin changes post-collision cue motion and sidespin changes cushion exit", () => {
  const xs = [-1, 1].map((top) => {
    const a = ball(0, -0.12, 0),
      b = ball(1, 0, 0);
    applyShot(a, 0, 40, { side: 0, top, elevation: 0 });
    const w = createWorld([a, b]);
    for (let i = 0; i < 30; i++) stepWorld(w);
    return w.balls[0].vx;
  });
  expect(xs[0]).toBeLessThan(xs[1]);
  expect(xs[0]).toBeLessThan(0);
  const zs = [-1, 1].map((side) => {
    const a = ball(0, 1.15, 0.2);
    applyShot(a, 0, 40, { side, top: 0, elevation: 0 });
    const w = createWorld([a], ideal);
    for (let i = 0; i < 12; i++) stepWorld(w);
    return w.balls[0].vz;
  });
  expect(zs[0] * zs[1]).toBeLessThan(0);
});
it("cloth dissipates mechanical energy and converges slip to rolling", () => {
  const a = ball(0, -0.8, 0.2);
  applyShot(a, 0, 10);
  const w = createWorld([a], DEFAULT_CONFIG);
  let previous = totals(w).energy;
  for (let i = 0; i < 1200; i++) {
    stepWorld(w);
    const e = totals(w).energy;
    expect(e).toBeLessThanOrEqual(previous + 1e-9);
    previous = e;
  }
  expect(w.balls[0].vx).toBe(0);
  expect(Math.abs(w.balls[0].wz)).toBe(0);
});
it("reject invalid spin/elevation and no pocket capture while ball is high", () => {
  for (const spin of [
    { side: NaN, top: 0, elevation: 0 },
    { side: 1, top: 1, elevation: 0 },
    { side: 0, top: 0, elevation: 71 },
  ])
    expect(applyShot(ball(0, 0, 0), 0, 10, spin)).toBeNull();
  const a = ball(0, 0, 0.62);
  a.y = 0.2;
  const w = createWorld([a], ideal);
  stepWorld(w);
  expect(w.balls[0].active).toBe(true);
});
it("airborne exit and landing outside bed emit one off-table event instead of leaving a stuck ball", () => {
  for (const x of [1.28, 1.32]) {
    const a = ball(0, x, 0.3);
    a.y = RADIUS + 0.02;
    a.vy = -0.1;
    const w = createWorld([a], ideal);
    let events = 0;
    for (let i = 0; i < 120; i++) {
      stepWorld(w);
      events += w.events.filter((e) => e.kind === "off").length;
    }
    expect(events).toBe(1);
    expect(w.balls[0].active).toBe(false);
  }
});

import { expect, it } from "vitest";
import { BilliardSession } from "../../src/games/billiard/session";
import { DEFAULT_CONFIG, DT, RADIUS } from "../../src/games/billiard/physics";
function finish(s: BilliardSession) {
  for (let i = 0; i < 12000 && s.status === "moving"; i++) s.tick();
  expect(s.status).not.toBe("moving");
}
it("rack has all 16 ids, eight in centre, opposite groups at rear corners and no overlaps", () => {
  const s = new BilliardSession();
  expect(s.world.balls.map((b) => b.id)).toEqual(
    Array.from({ length: 16 }, (_, i) => i),
  );
  expect(s.world.balls[8].z).toBe(0);
  for (const a of s.world.balls)
    for (const b of s.world.balls)
      if (a.id !== b.id)
        expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(2 * RADIUS);
  const rear = s.world.balls
    .filter((b) => b.x === Math.max(...s.world.balls.map((v) => v.x)))
    .sort((a, b) => a.z - b.z);
  expect(rear).toHaveLength(5);
  expect(rear[0].id < 8).not.toBe(rear[4].id < 8);
  expect(s.world.balls[8].x).toBeCloseTo(
    0.635 + 2 * (Math.sqrt(3) * RADIUS + 0.0003),
  );
});
it("shot applied once, pause freezes state, safe restart and zero shot rejected", () => {
  const s = new BilliardSession();
  s.setPower(0);
  expect(s.queueShot()).toBe(false);
  s.setPower(75);
  expect(s.queueShot()).toBe(true);
  expect(s.queueShot()).toBe(false);
  s.tick();
  expect(s.strokes).toBe(1);
  s.setPaused(true);
  const w = structuredClone(s.world);
  s.advance(1);
  s.tick();
  expect(s.world).toEqual(w);
  s.setPaused(false);
  finish(s);
  expect(s.world.eventLimitHits).toBe(0);
  expect(new BilliardSession().strokes).toBe(0);
});
it("miss changes turn, grants ball in hand, rejects overlap/boundary and locks shot until placement", () => {
  const s = new BilliardSession();
  s.breaking = false;
  s.setCall(0, -1);
  s.setAngle(Math.PI);
  s.setPower(5);
  s.queueShot();
  finish(s);
  expect(s.player).toBe(1);
  expect(s.ballInHand).toBe(true);
  expect(s.queueShot()).toBe(false);
  expect(s.placeBall(1, 0, 0)).toBe(false);
  expect(s.placeBall(0, 1.3, 0)).toBe(false);
  expect(s.placeBall(0, s.world.balls[1].x, s.world.balls[1].z)).toBe(false);
  expect(s.placeBall(0, -0.7, 0.3)).toBe(true);
  expect(s.canShoot).toBe(true);
});
it("simulation permits any ball setup with no overlap and no turn/win logic", () => {
  const s = new BilliardSession("simulation");
  expect(s.placeBall(8, -0.4, 0.4)).toBe(true);
  expect(s.placeBall(2, -0.4, 0.4)).toBe(false);
  for (const id of [-1, 16, NaN, 0.5])
    expect(s.placeBall(id, 0, 0.3)).toBe(false);
  s.setPower(5);
  s.setAngle(Math.PI);
  s.queueShot();
  finish(s);
  expect(s.status).toBe("ready");
  expect(s.player).toBe(0);
  expect(s.ballInHand).toBe(false);
});
it("30/60/120 FPS and both modes share exact physics at equal ticks", () => {
  const baseline = new BilliardSession().world;
  const worlds = [30, 60, 120].map((fps) => {
    const s = new BilliardSession("simulation");
    s.world = structuredClone(baseline);
    s.setPower(40);
    s.setSpin(0.4, 0.5, 40);
    s.queueShot();
    for (let i = 0; i < fps; i++) s.advance(1 / fps);
    return s.world;
  });
  expect(worlds[0].tick).toBe(120);
  expect(worlds[0]).toEqual(worlds[1]);
  expect(worlds[1]).toEqual(worlds[2]);
  const a = new BilliardSession(),
    b = new BilliardSession("simulation");
  b.world = structuredClone(a.world);
  a.queueShot();
  b.queueShot();
  for (let i = 0; i < 120; i++) {
    a.tick();
    b.tick();
  }
  expect(a.world).toEqual(b.world);
});
it("configuration drives shot mass, large frames drop backlog, invalid delta ignored", () => {
  const s = new BilliardSession("simulation", { ...DEFAULT_CONFIG, mass: 0.3 });
  s.setPower(10);
  s.queueShot();
  s.advance(5);
  expect(s.lastShot?.impulse).toBeCloseTo(0.24);
  expect(s.world.tick).toBe(8);
  expect(s.droppedFrames).toBe(1);
  s.advance(NaN);
  s.setPaused(true);
  s.advance(DT);
  expect(s.world.tick).toBe(8);
});
it("default break is legal, settles and keeps groups open", () => {
  const s = new BilliardSession();
  s.queueShot();
  finish(s);
  expect(
    s.penalties,
    JSON.stringify({ notice: s.notice, record: s.record }),
  ).toBe(0);
  expect(s.groups).toEqual([null, null]);
  expect(s.breaking).toBe(false);
});

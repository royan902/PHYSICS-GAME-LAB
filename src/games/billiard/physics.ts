// SI: metres, kilograms, seconds. XZ plane; Y belongs only to rendering.
export const DT = 1 / 120;
export const RADIUS = 0.028575;
export const HALF_LENGTH = 1.27;
export const HALF_WIDTH = 0.635;
export const POCKET_RADIUS = 0.065;
export const POCKETS = [-HALF_LENGTH, 0, HALF_LENGTH].flatMap((x) =>
  [-HALF_WIDTH, HALF_WIDTH].map((z) => ({ x, z })),
);
export type Ball = {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  mass: number;
  active: boolean;
};
export type Config = {
  mass: number;
  friction: number;
  restitution: number;
  cushion: number;
};
export const DEFAULT_CONFIG: Config = {
  mass: 0.17,
  friction: 0.02,
  restitution: 0.95,
  cushion: 0.8,
};
export type World = {
  balls: Ball[];
  config: Config;
  tick: number;
  pockets: number[];
  eventLimitHits: number;
  cushionHits: number;
};
export type Rail = { axis: "x" | "z"; side: number; lo: number; hi: number };
const gap = 0.095;
export const RAILS: Rail[] = [-1, 1].flatMap((sign) => [
  { axis: "z", side: sign * HALF_WIDTH, lo: -HALF_LENGTH + gap, hi: -gap },
  { axis: "z", side: sign * HALF_WIDTH, lo: gap, hi: HALF_LENGTH - gap },
  {
    axis: "x",
    side: sign * HALF_LENGTH,
    lo: -HALF_WIDTH + gap,
    hi: HALF_WIDTH - gap,
  },
]);
export function validateConfig(c: Config) {
  if (
    !Object.values(c).every(Number.isFinite) ||
    c.mass < 0.1 ||
    c.mass > 0.3 ||
    c.friction < 0 ||
    c.friction > 0.08 ||
    c.restitution < 0 ||
    c.restitution > 1 ||
    c.cushion < 0 ||
    c.cushion > c.restitution
  )
    throw new Error("Parameter fisika di luar rentang SI yang didukung.");
}
export function ball(id: number, x: number, z: number, mass = 0.17): Ball {
  return { id, x, z, mass, vx: 0, vz: 0, active: true };
}
export function createWorld(balls: Ball[], config = DEFAULT_CONFIG): World {
  validateConfig(config);
  if (
    balls.some(
      (b) =>
        ![b.x, b.z, b.vx, b.vz, b.mass].every(Number.isFinite) || b.mass <= 0,
    )
  )
    throw new Error("Bola tidak valid.");
  return {
    balls: balls.map((b) => ({ ...b })),
    config: { ...config },
    tick: 0,
    pockets: [],
    eventLimitHits: 0,
    cushionHits: 0,
  };
}
export const speed = (b: Ball) => Math.hypot(b.vx, b.vz);
export function shotMetrics(power: number, mass: number) {
  const velocity = Math.max(0, Math.min(100, power)) * 0.05;
  return {
    velocity,
    impulse: mass * velocity,
    energy: 0.5 * mass * velocity ** 2,
  };
}
export function applyShot(b: Ball, angle: number, power: number) {
  if (
    ![angle, power].every(Number.isFinite) ||
    !b.active ||
    speed(b) > 0.01 ||
    power <= 0 ||
    power > 100
  )
    return null;
  const metrics = shotMetrics(power, b.mass);
  b.vx = (metrics.impulse * Math.cos(angle)) / b.mass;
  b.vz = (metrics.impulse * Math.sin(angle)) / b.mass;
  return { ...metrics, velocity: speed(b) };
}
// Earliest inward crossing of a circle; used for moving discs, rounded jaws and pockets.
function circleTime(
  x: number,
  z: number,
  vx: number,
  vz: number,
  radius: number,
): number {
  const a = vx * vx + vz * vz,
    dot = x * vx + z * vz;
  const c = x * x + z * z - radius * radius;
  if (c <= 1e-12) return dot < -1e-12 ? 0 : Infinity;
  if (a < 1e-20 || dot >= 0) return Infinity;
  const discriminant = dot * dot - a * c;
  return discriminant < 0
    ? Infinity
    : Math.max(0, (-dot - Math.sqrt(discriminant)) / a);
}
type Hit = {
  time: number;
  kind: "ball" | "rail" | "pocket";
  a: Ball;
  b?: Ball;
  nx?: number;
  nz?: number;
};
function drag(b: Ball, amount: number) {
  const v = speed(b);
  if (v === 0) return;
  const scale = Math.max(0, v - amount) / v;
  b.vx *= scale;
  b.vz *= scale;
}
export function stepWorld(w: World) {
  w.pockets = [];
  const active = w.balls.filter((b) => b.active);
  const deceleration = w.config.friction * 9.81;
  for (const b of active) drag(b, (deceleration * DT) / 2);
  let remaining = DT,
    events = 0;
  while (remaining > 1e-10 && events < 64) {
    let hit: Hit | undefined;
    function consider(candidate: Hit) {
      if (candidate.time <= remaining && (!hit || candidate.time < hit.time))
        hit = candidate;
    }
    for (let i = 0; i < active.length; i++) {
      const a = active[i];
      if (!a.active) continue;
      for (const p of POCKETS) {
        const inside = Math.hypot(a.x - p.x, a.z - p.z) <= POCKET_RADIUS;
        consider({
          time: inside
            ? 0
            : circleTime(a.x - p.x, a.z - p.z, a.vx, a.vz, POCKET_RADIUS),
          kind: "pocket",
          a,
        });
      }
      for (let j = i + 1; j < active.length; j++) {
        const b = active[j];
        if (b.active)
          consider({
            time: circleTime(
              a.x - b.x,
              a.z - b.z,
              a.vx - b.vx,
              a.vz - b.vz,
              2 * RADIUS,
            ),
            kind: "ball",
            a,
            b,
          });
      }
      for (const r of RAILS) {
        const sign = Math.sign(r.side);
        const pos = r.axis === "x" ? a.x : a.z;
        const vel = r.axis === "x" ? a.vx : a.vz;
        if (vel * sign > 1e-12) {
          const t = (r.side - sign * RADIUS - pos) / vel;
          const along = r.axis === "x" ? a.z + a.vz * t : a.x + a.vx * t;
          if (t >= -1e-10 && along >= r.lo && along <= r.hi)
            consider({
              time: Math.max(0, t),
              kind: "rail",
              a,
              nx: r.axis === "x" ? -sign : 0,
              nz: r.axis === "z" ? -sign : 0,
            });
        }
        for (const end of [r.lo, r.hi]) {
          const x = r.axis === "x" ? r.side : end,
            z = r.axis === "x" ? end : r.side;
          const t = circleTime(a.x - x, a.z - z, a.vx, a.vz, RADIUS);
          if (t <= remaining) {
            const dx = a.x + a.vx * t - x,
              dz = a.z + a.vz * t - z,
              length = Math.hypot(dx, dz);
            consider({
              time: t,
              kind: "rail",
              a,
              nx: dx / length,
              nz: dz / length,
            });
          }
        }
      }
    }
    const time = hit ? hit.time : remaining;
    for (const b of active)
      if (b.active) {
        b.x += b.vx * time;
        b.z += b.vz * time;
      }
    remaining -= time;
    if (!hit) break;
    events++;
    const { a, b } = hit;
    if (hit.kind === "pocket") {
      a.active = false;
      a.vx = 0;
      a.vz = 0;
      w.pockets.push(a.id);
    } else if (b) {
      const dx = b.x - a.x,
        dz = b.z - a.z,
        length = Math.hypot(dx, dz);
      const nx = length > 0 ? dx / length : 1,
        nz = length > 0 ? dz / length : 0;
      const normalSpeed = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (normalSpeed < 0) {
        const impulse =
          (-(1 + w.config.restitution) * normalSpeed) /
          (1 / a.mass + 1 / b.mass);
        a.vx -= (impulse * nx) / a.mass;
        a.vz -= (impulse * nz) / a.mass;
        b.vx += (impulse * nx) / b.mass;
        b.vz += (impulse * nz) / b.mass;
      }
      const correction = Math.max(0, 2 * RADIUS - length) + 1e-9;
      a.x -= (nx * correction) / 2;
      a.z -= (nz * correction) / 2;
      b.x += (nx * correction) / 2;
      b.z += (nz * correction) / 2;
    } else {
      const nx = hit.nx!,
        nz = hit.nz!;
      const dot = a.vx * nx + a.vz * nz;
      if (dot < 0) {
        a.vx -= (1 + w.config.cushion) * dot * nx;
        a.vz -= (1 + w.config.cushion) * dot * nz;
        w.cushionHits++;
      }
      a.x += nx * 1e-9;
      a.z += nz * 1e-9;
    }
  }
  if (events >= 64 && remaining > 1e-10) w.eventLimitHits++;
  for (const b of active) if (b.active) drag(b, (deceleration * DT) / 2);
  w.tick++;
}
export function totals(w: World) {
  return w.balls
    .filter((b) => b.active)
    .reduce(
      (sum, b) => ({
        px: sum.px + b.mass * b.vx,
        pz: sum.pz + b.mass * b.vz,
        energy: sum.energy + 0.5 * b.mass * speed(b) ** 2,
      }),
      { px: 0, pz: 0, energy: 0 },
    );
}

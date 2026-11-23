// SI: metres, kilograms, seconds, radians. Y up; cloth at Y=0.
export const DT = 1 / 120;
export const RADIUS = 0.028575;
export const HALF_LENGTH = 1.27;
export const HALF_WIDTH = 0.635;
export const POCKET_RADIUS = 0.065;
export const POCKETS = [-HALF_LENGTH, 0, HALF_LENGTH].flatMap((x) =>
  [-HALF_WIDTH, HALF_WIDTH].map((z) => ({ x, z })),
);
export type Ball = {
  exit?: { vx: number; vy: number; vz: number; pocket: number };
  id: number;
  x: number;
  z: number;
  y: number;
  vy: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  wx: number;
  wy: number;
  wz: number;
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
  friction: 0.01,
  restitution: 0.95,
  cushion: 0.8,
};
type Point = Pick<Ball, "x" | "y" | "z">;
function cuePoint(b: Ball): Point | undefined {
  return b.id === 0 ? { x: b.x, y: b.y, z: b.z } : undefined;
}
export type World = {
  balls: Ball[];
  config: Config;
  tick: number;
  pockets: number[];
  eventLimitHits: number;
  cushionHits: number;
  events: (
    | {
        kind: "contact";
        a: number;
        b: number;
        cueAt?: Point;
        ax: number;
        bx: number;
        strength: number;
      }
    | { kind: "rail"; id: number; strength: number; cueAt?: Point }
    | { kind: "off" | "land"; id: number; strength: number }
    | { kind: "pocket"; id: number; pocket: number; strength: number }
  )[];
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
  return {
    id,
    x,
    z,
    y: RADIUS,
    mass,
    vx: 0,
    vy: 0,
    vz: 0,
    qx: Math.SQRT1_2,
    qy: 0,
    qz: 0,
    qw: Math.SQRT1_2,
    wx: 0,
    wy: 0,
    wz: 0,
    active: true,
  };
}
export function createWorld(balls: Ball[], config = DEFAULT_CONFIG): World {
  validateConfig(config);
  if (
    balls.some(
      (b) =>
        ![
          b.x,
          b.y,
          b.z,
          b.vx,
          b.vy,
          b.vz,
          b.wx,
          b.wy,
          b.wz,
          b.qx,
          b.qy,
          b.qz,
          b.qw,
          b.mass,
        ].every(Number.isFinite) || b.mass <= 0,
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
    events: [],
  };
}
export const speed = (b: Ball) => Math.hypot(b.vx, b.vy, b.vz);
export const angularSpeed = (b: Ball) => Math.hypot(b.wx, b.wy, b.wz);
export type Shot = { side: number; top: number; elevation: number };
export const CENTER_SHOT: Shot = { side: 0, top: 0, elevation: 0 };
export function shotMetrics(
  power: number,
  mass: number,
  shot: Shot = CENTER_SHOT,
) {
  const v = Math.max(0, Math.min(100, power)) * 0.08;
  const theta = (shot.elevation * Math.PI) / 180;
  const down = v * Math.sin(theta);
  // shortcut: instantaneous bed rebound, replace with compliant cue/cloth contact for calibrated jump shots.
  const vertical = down > 0.35 ? down * 0.35 : 0;
  const horizontal = v * Math.cos(theta);
  const offset = Math.hypot(shot.side, shot.top) * RADIUS * 0.65;
  const omega = (mass * v * offset) / (0.4 * mass * RADIUS ** 2);
  return {
    velocity: Math.hypot(horizontal, vertical),
    horizontal,
    vertical,
    impulse: mass * v,
    height: vertical ** 2 / (2 * 9.81),
    energy:
      0.5 * mass * (horizontal ** 2 + vertical ** 2) +
      0.2 * mass * RADIUS ** 2 * omega ** 2,
  };
}
export function applyShot(
  b: Ball,
  angle: number,
  power: number,
  shot: Shot = CENTER_SHOT,
) {
  if (
    ![angle, power, shot.side, shot.top, shot.elevation].every(
      Number.isFinite,
    ) ||
    !b.active ||
    speed(b) > 0.01 ||
    power <= 0 ||
    power > 100 ||
    Math.hypot(shot.side, shot.top) > 1.000001 ||
    shot.elevation < 0 ||
    shot.elevation > 70
  )
    return null;
  const metrics = shotMetrics(power, b.mass, shot);
  const c = Math.cos(angle),
    s = Math.sin(angle),
    theta = (shot.elevation * Math.PI) / 180;
  const impulse = metrics.impulse;
  // Contact offsets in cue's perpendicular plane; angular impulse is r cross J.
  const side = shot.side * RADIUS * 0.65,
    top = shot.top * RADIUS * 0.65;
  const rx = -s * side + c * Math.sin(theta) * top;
  const ry = Math.cos(theta) * top;
  const rz = c * side + s * Math.sin(theta) * top;
  const jx = impulse * Math.cos(theta) * c,
    jy = -impulse * Math.sin(theta),
    jz = impulse * Math.cos(theta) * s;
  const inertia = 0.4 * b.mass * RADIUS ** 2;
  b.wx = (ry * jz - rz * jy) / inertia;
  b.wy = (rz * jx - rx * jz) / inertia;
  b.wz = (rx * jy - ry * jx) / inertia;
  b.vx = metrics.horizontal * c;
  b.vz = metrics.horizontal * s;
  b.vy = metrics.vertical;
  return { ...metrics, velocity: speed(b) };
}
// Earliest inward crossing of a circle; used for moving discs, rounded jaws and pockets.
function circleTime(
  x: number,
  z: number,
  vx: number,
  vz: number,
  radius: number,
  y = 0,
  vy = 0,
): number {
  const a = vx * vx + vz * vz + vy * vy,
    dot = x * vx + z * vz + y * vy;
  const c = x * x + z * z + y * y - radius * radius;
  if (c <= 1e-12) return dot < -1e-12 ? 0 : Infinity;
  if (a < 1e-20 || dot >= 0) return Infinity;
  const discriminant = dot * dot - a * c;
  return discriminant < 0
    ? Infinity
    : Math.max(0, (-dot - Math.sqrt(discriminant)) / a);
}
type Hit = {
  time: number;
  kind: "ball" | "rail" | "pocket" | "floor";
  a: Ball;
  b?: Ball;
  nx?: number;
  nz?: number;
};
function cloth(b: Ball, config: Config, dt: number) {
  if (b.y > RADIUS + 1e-7 || b.vy > 0) return;
  const sx = b.vx + RADIUS * b.wz,
    sz = b.vz - RADIUS * b.wx;
  const slip = Math.hypot(sx, sz);
  const f = config.friction * 9.81 * dt;
  if (slip > 1e-9) {
    const dv = Math.min(slip / 3.5, f * 5);
    const dx = (dv * sx) / slip,
      dz = (dv * sz) / slip;
    b.vx -= dx;
    b.vz -= dz;
    b.wx += (2.5 * dz) / RADIUS;
    b.wz -= (2.5 * dx) / RADIUS;
  } else {
    const v = Math.hypot(b.vx, b.vz),
      scale = v ? Math.max(0, v - f) / v : 0;
    b.vx *= scale;
    b.vz *= scale;
    b.wx = b.vz / RADIUS;
    b.wz = -b.vx / RADIUS;
  }
  b.wy = Math.sign(b.wy) * Math.max(0, Math.abs(b.wy) - f / RADIUS);
}
export function stepWorld(w: World) {
  w.events = [];
  w.pockets = [];
  // Four bounded substeps retain continuous impacts while resolving gravity/cloth contact.
  for (let sub = 0; sub < 4; sub++) substep(w, DT / 4);
  w.tick++;
}
function substep(w: World, dt: number) {
  const active = w.balls.filter((b) => b.active);
  for (const b of active) {
    cloth(b, w.config, dt / 2);
    if (b.y > RADIUS + 1e-9 || b.vy > 0) b.vy -= (9.81 * dt) / 2;
  }
  let remaining = dt,
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
      if (a.vy < -1e-12)
        consider({
          time: Math.max(0, (RADIUS - a.y) / a.vy),
          kind: "floor",
          a,
        });
      for (const p of POCKETS) {
        if (a.y > RADIUS + 0.018) continue;
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
              a.y - b.y,
              a.vy - b.vy,
            ),
            kind: "ball",
            a,
            b,
          });
      }
      for (const r of RAILS) {
        if (a.y > RADIUS + 0.055) continue;
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
        b.y += b.vy * time;
        const omega = angularSpeed(b);
        if (omega > 0) {
          const sin = Math.sin((omega * time) / 2) / omega,
            c = Math.cos((omega * time) / 2);
          const x = b.wx * sin,
            y = b.wy * sin,
            z = b.wz * sin;
          const { qx, qy, qz, qw } = b;
          b.qx = c * qx + x * qw + y * qz - z * qy;
          b.qy = c * qy - x * qz + y * qw + z * qx;
          b.qz = c * qz + x * qy - y * qx + z * qw;
          b.qw = c * qw - x * qx - y * qy - z * qz;
        }
      }
    remaining -= time;
    if (!hit) break;
    events++;
    const { a, b } = hit;
    if (hit.kind === "floor") {
      if (a.vy < -0.2)
        w.events.push({ kind: "land", id: a.id, strength: -a.vy });
      a.y = RADIUS;
      a.vy = a.vy < -0.35 ? -a.vy * 0.25 : 0;
    } else if (hit.kind === "pocket") {
      const pocket = POCKETS.indexOf(
        POCKETS.reduce((best, p) =>
          Math.hypot(p.x - a.x, p.z - a.z) <
          Math.hypot(best.x - a.x, best.z - a.z)
            ? p
            : best,
        ),
      );
      a.exit = { vx: a.vx, vy: a.vy, vz: a.vz, pocket };
      a.active = false;
      a.vx = 0;
      a.vz = 0;
      a.vy = 0;
      a.wx = 0;
      a.wy = 0;
      a.wz = 0;
      w.pockets.push(a.id);
      w.events.push({
        kind: "pocket",
        id: a.id,
        pocket,
        strength: Math.hypot(a.exit.vx, a.exit.vz),
      });
    } else if (b) {
      const dx = b.x - a.x,
        dz = b.z - a.z,
        dy = b.y - a.y,
        length = Math.hypot(dx, dy, dz);
      const nx = length > 0 ? dx / length : 1,
        nz = length > 0 ? dz / length : 0,
        ny = length > 0 ? dy / length : 0;
      const normalSpeed =
        (b.vx - a.vx) * nx + (b.vz - a.vz) * nz + (b.vy - a.vy) * ny;
      if (normalSpeed < 0) {
        const impulse =
          (-(1 + w.config.restitution) * normalSpeed) /
          (1 / a.mass + 1 / b.mass);
        w.events.push({
          kind: "contact",
          a: a.id,
          b: b.id,
          cueAt: cuePoint(a) ?? cuePoint(b),
          ax: a.x,
          bx: b.x,
          strength: -normalSpeed,
        });
        a.vy -= (impulse * ny) / a.mass;
        b.vy += (impulse * ny) / b.mass;
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
      a.y -= (ny * correction) / 2;
      b.y += (ny * correction) / 2;
    } else {
      const nx = hit.nx!,
        nz = hit.nz!;
      const dot = a.vx * nx + a.vz * nz;
      if (dot < 0) {
        a.vx -= (1 + w.config.cushion) * dot * nx;
        a.vz -= (1 + w.config.cushion) * dot * nz;
        // Tangential cushion impulse transfers side spin, bounded by Coulomb friction.
        const tx = -nz,
          tz = nx;
        const slip = a.vx * tx + a.vz * tz - a.wy * RADIUS;
        const dv = Math.max(
          -0.12 * Math.abs(dot),
          Math.min(0.12 * Math.abs(dot), -slip / 3.5),
        );
        a.vx += dv * tx;
        a.vz += dv * tz;
        a.wy -= (2.5 * dv) / RADIUS;
        w.cushionHits++;
        w.events.push({
          kind: "rail",
          id: a.id,
          strength: -dot,
          cueAt: cuePoint(a),
        });
      }
      a.x += nx * 1e-9;
      a.z += nz * 1e-9;
    }
  }
  if (events >= 64 && remaining > 1e-10) w.eventLimitHits++;
  for (const b of active)
    if (b.active) {
      if (b.y > RADIUS + 1e-9 || b.vy > 0) b.vy -= (9.81 * dt) / 2;
      if (b.y < RADIUS) {
        b.y = RADIUS;
        if (b.vy < 0) b.vy = 0;
      }
      cloth(b, w.config, dt / 2);
      if (
        Math.abs(b.x) > HALF_LENGTH + RADIUS ||
        Math.abs(b.z) > HALF_WIDTH + RADIUS ||
        (b.y <= RADIUS + 1e-6 &&
          (Math.abs(b.x) > HALF_LENGTH || Math.abs(b.z) > HALF_WIDTH) &&
          POCKETS.every(
            (p) => Math.hypot(b.x - p.x, b.z - p.z) > POCKET_RADIUS,
          ))
      ) {
        b.exit = { vx: b.vx, vy: b.vy, vz: b.vz, pocket: -1 };
        b.active = false;
        b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0;
        w.events.push({
          kind: "off",
          id: b.id,
          strength: Math.hypot(b.exit.vx, b.exit.vy, b.exit.vz),
        });
      }
    }
}
export function totals(w: World) {
  return w.balls
    .filter((b) => b.active)
    .reduce(
      (sum, b) => ({
        px: sum.px + b.mass * b.vx,
        pz: sum.pz + b.mass * b.vz,
        py: sum.py + b.mass * b.vy,
        energy:
          sum.energy +
          0.5 * b.mass * speed(b) ** 2 +
          0.2 * b.mass * RADIUS ** 2 * angularSpeed(b) ** 2,
      }),
      { px: 0, py: 0, pz: 0, energy: 0 },
    );
}

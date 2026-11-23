/**
 * Cannon Physics kernel (3D projectile motion, Y up, SI units).
 * Direction convention: (cos(theta)*cos(phi), sin(theta), cos(theta)*sin(phi)).
 */

export const CANNON_DT = 1 / 120;

export const CANNON_DEFAULTS = Object.freeze({
  mass: 1.0,
  radius: 0.05,
  v0: 20.0,
  elevationDeg: 45,
  azimuthDeg: 0,
  gravity: 9.81,
  dragEnabled: false,
  airDensity: 1.225,
  dragCoeff: 0.47,
  barrelLength: 1.2,
  pivotX: 0,
  pivotY: 0.6,
  pivotZ: 0,
  groundY: 0,
  target: Object.freeze({ x: 32.0, y: 0.75, z: 0.0, radius: 0.9 }),
});

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

export function clampCannonParams(raw = {}) {
  return {
    mass: clampNumber(raw.mass ?? CANNON_DEFAULTS.mass, 0.1, 10),
    radius: clampNumber(raw.radius ?? CANNON_DEFAULTS.radius, 0.02, 0.25),
    v0: clampNumber(raw.v0 ?? CANNON_DEFAULTS.v0, 1, 50),
    elevationDeg: clampNumber(
      raw.elevationDeg ?? CANNON_DEFAULTS.elevationDeg,
      0,
      85,
    ),
    azimuthDeg: clampNumber(
      raw.azimuthDeg ?? CANNON_DEFAULTS.azimuthDeg,
      -180,
      180,
    ),
    gravity: clampNumber(raw.gravity ?? CANNON_DEFAULTS.gravity, 1, 20),
    dragEnabled: Boolean(raw.dragEnabled ?? CANNON_DEFAULTS.dragEnabled),
    airDensity: clampNumber(
      raw.airDensity ?? CANNON_DEFAULTS.airDensity,
      0.1,
      5,
    ),
    dragCoeff: clampNumber(
      raw.dragCoeff ?? CANNON_DEFAULTS.dragCoeff,
      0.05,
      1.5,
    ),
    barrelLength: clampNumber(
      raw.barrelLength ?? CANNON_DEFAULTS.barrelLength,
      0,
      3,
    ),
    pivotX: Number(raw.pivotX ?? CANNON_DEFAULTS.pivotX),
    pivotY: Number(raw.pivotY ?? CANNON_DEFAULTS.pivotY),
    pivotZ: Number(raw.pivotZ ?? CANNON_DEFAULTS.pivotZ),
    groundY: Number(raw.groundY ?? CANNON_DEFAULTS.groundY),
  };
}

export function computeDirectionVector(elevationDeg, azimuthDeg) {
  const theta = (Number(elevationDeg) * Math.PI) / 180;
  const phi = (Number(azimuthDeg) * Math.PI) / 180;
  const cosT = Math.cos(theta);
  return {
    x: cosT * Math.cos(phi),
    y: Math.sin(theta),
    z: cosT * Math.sin(phi),
  };
}

export function computeMuzzleOrigin(params) {
  const dir = computeDirectionVector(params.elevationDeg, params.azimuthDeg);
  return {
    x: params.pivotX + params.barrelLength * dir.x,
    y: params.pivotY + params.barrelLength * dir.y,
    z: params.pivotZ + params.barrelLength * dir.z,
  };
}

export function createCannonState(options = {}) {
  const params = clampCannonParams(options.params ?? options);
  const levelOrigin = options.levelLaunch
    ? { x: 0, y: params.radius, z: 0 }
    : null;
  const origin = options.origin ?? levelOrigin ?? computeMuzzleOrigin(params);
  const target = options.target
    ? {
        x: Number(options.target.x ?? CANNON_DEFAULTS.target.x),
        y: Number(options.target.y ?? CANNON_DEFAULTS.target.y),
        z: Number(options.target.z ?? CANNON_DEFAULTS.target.z),
        radius: Number(options.target.radius ?? CANNON_DEFAULTS.target.radius),
      }
    : { ...CANNON_DEFAULTS.target };

  return {
    mode: options.mode === "simulation" ? "simulation" : "game",
    params,
    levelLaunch: Boolean(options.levelLaunch),
    origin,
    target,
    x: origin.x,
    y: origin.y,
    z: origin.z,
    vx: 0,
    vy: 0,
    vz: 0,
    time: 0,
    maxHeight: origin.y,
    status: "ready",
    impactEvent: null,
    shotsFired: 0,
    hits: 0,
    trail: [],
    lastTrail: [],
  };
}

export function fireCannon(state) {
  if (state.status === "flying") return state;
  const params = state.params;
  const origin = state.levelLaunch
    ? { x: 0, y: params.radius, z: 0 }
    : computeMuzzleOrigin(params);
  const dir = computeDirectionVector(params.elevationDeg, params.azimuthDeg);

  if (state.trail.length > 1) {
    state.lastTrail = state.trail.slice();
  }

  state.origin = origin;
  state.x = origin.x;
  state.y = origin.y;
  state.z = origin.z;
  state.vx = params.v0 * dir.x;
  state.vy = params.v0 * dir.y;
  state.vz = params.v0 * dir.z;
  state.time = 0;
  state.maxHeight = origin.y;
  state.status = "flying";
  state.impactEvent = null;
  state.shotsFired += 1;
  state.trail = [{ x: origin.x, y: origin.y, z: origin.z }];
  return state;
}

function closestSegmentFraction3D(ax, ay, az, bx, by, bz, px, py, pz) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const lenSq = dx * dx + dy * dy + dz * dz;
  if (lenSq <= 1e-12) return 0;
  const t = ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / lenSq;
  return Math.min(1, Math.max(0, t));
}

function computeAcceleration(vx, vy, vz, params) {
  if (!params.dragEnabled) {
    return { ax: 0, ay: -params.gravity, az: 0 };
  }
  const speed = Math.hypot(vx, vy, vz);
  const area = Math.PI * params.radius * params.radius;
  const factor =
    (0.5 * params.airDensity * params.dragCoeff * area * speed) / params.mass;
  return {
    ax: -factor * vx,
    ay: -params.gravity - factor * vy,
    az: -factor * vz,
  };
}

export function stepCannon(state, dt = CANNON_DT) {
  if (state.status !== "flying") return state;

  const params = state.params;
  const prevX = state.x;
  const prevY = state.y;
  const prevZ = state.z;
  const prevVx = state.vx;
  const prevVy = state.vy;
  const prevVz = state.vz;

  let nextX, nextY, nextZ, nextVx, nextVy, nextVz;

  if (!params.dragEnabled) {
    // Exact constant-gravity parabolic integration.
    nextX = prevX + prevVx * dt;
    nextY = prevY + prevVy * dt - 0.5 * params.gravity * dt * dt;
    nextZ = prevZ + prevVz * dt;
    nextVx = prevVx;
    nextVy = prevVy - params.gravity * dt;
    nextVz = prevVz;
  } else {
    // RK4 for quadratic air drag.
    const k1a = computeAcceleration(prevVx, prevVy, prevVz, params);
    const k2vx = prevVx + 0.5 * dt * k1a.ax;
    const k2vy = prevVy + 0.5 * dt * k1a.ay;
    const k2vz = prevVz + 0.5 * dt * k1a.az;
    const k2a = computeAcceleration(k2vx, k2vy, k2vz, params);

    const k3vx = prevVx + 0.5 * dt * k2a.ax;
    const k3vy = prevVy + 0.5 * dt * k2a.ay;
    const k3vz = prevVz + 0.5 * dt * k2a.az;
    const k3a = computeAcceleration(k3vx, k3vy, k3vz, params);

    const k4vx = prevVx + dt * k3a.ax;
    const k4vy = prevVy + dt * k3a.ay;
    const k4vz = prevVz + dt * k3a.az;
    const k4a = computeAcceleration(k4vx, k4vy, k4vz, params);

    nextX = prevX + (dt / 6) * (prevVx + 2 * k2vx + 2 * k3vx + k4vx);
    nextY = prevY + (dt / 6) * (prevVy + 2 * k2vy + 2 * k3vy + k4vy);
    nextZ = prevZ + (dt / 6) * (prevVz + 2 * k2vz + 2 * k3vz + k4vz);
    nextVx = prevVx + (dt / 6) * (k1a.ax + 2 * k2a.ax + 2 * k3a.ax + k4a.ax);
    nextVy = prevVy + (dt / 6) * (k1a.ay + 2 * k2a.ay + 2 * k3a.ay + k4a.ay);
    nextVz = prevVz + (dt / 6) * (k1a.az + 2 * k2a.az + 2 * k3a.az + k4a.az);
  }

  // Swept target sphere collision check (one impact event per shot).
  if (state.target && !state.impactEvent) {
    const tFrac = closestSegmentFraction3D(
      prevX,
      prevY,
      prevZ,
      nextX,
      nextY,
      nextZ,
      state.target.x,
      state.target.y,
      state.target.z,
    );
    const cx = prevX + (nextX - prevX) * tFrac;
    const cy = prevY + (nextY - prevY) * tFrac;
    const cz = prevZ + (nextZ - prevZ) * tFrac;
    const distToTarget = Math.hypot(
      cx - state.target.x,
      cy - state.target.y,
      cz - state.target.z,
    );
    if (distToTarget <= params.radius + state.target.radius) {
      state.x = cx;
      state.y = cy;
      state.z = cz;
      state.vx = 0;
      state.vy = 0;
      state.vz = 0;
      state.time += dt * tFrac;
      state.maxHeight = Math.max(state.maxHeight, cy);
      state.status = "hit";
      state.hits += 1;
      state.impactEvent = {
        type: "target",
        x: cx,
        y: cy,
        z: cz,
        time: state.time,
        range: Math.hypot(cx - state.origin.x, cz - state.origin.z),
      };
      state.trail.push({ x: cx, y: cy, z: cz });
      return state;
    }
  }

  // Ground crossing interpolation at ball center y = groundY + radius.
  const floorY = params.groundY + params.radius;
  if (nextY <= floorY && prevVy <= 0) {
    const denom = prevY - nextY;
    const gFrac =
      denom > 1e-9 ? clampNumber((prevY - floorY) / denom, 0, 1) : 1;
    const gx = prevX + (nextX - prevX) * gFrac;
    const gz = prevZ + (nextZ - prevZ) * gFrac;
    const impactTime = state.time + dt * gFrac;
    state.x = gx;
    state.y = floorY;
    state.z = gz;
    state.vx = 0;
    state.vy = 0;
    state.vz = 0;
    state.time = impactTime;
    state.status = "landed";
    state.impactEvent = {
      type: "ground",
      x: gx,
      y: floorY,
      z: gz,
      time: impactTime,
      range: Math.hypot(gx - state.origin.x, gz - state.origin.z),
    };
    state.trail.push({ x: gx, y: floorY, z: gz });
    return state;
  }

  state.x = nextX;
  state.y = nextY;
  state.z = nextZ;
  state.vx = nextVx;
  state.vy = nextVy;
  state.vz = nextVz;
  state.time += dt;
  state.maxHeight = Math.max(state.maxHeight, nextY);

  const last = state.trail[state.trail.length - 1];
  if (
    !last ||
    Math.hypot(nextX - last.x, nextY - last.y, nextZ - last.z) >= 0.25
  ) {
    state.trail.push({ x: nextX, y: nextY, z: nextZ });
  }

  return state;
}

export function getCannonTelemetry(state) {
  const { v0, elevationDeg, gravity } = state.params;
  const theta = (elevationDeg * Math.PI) / 180;
  const horizontalRange = Math.hypot(
    state.x - state.origin.x,
    state.z - state.origin.z,
  );
  const speed = Math.hypot(state.vx, state.vy, state.vz);
  const levelTheoreticalRange = (v0 * v0 * Math.sin(2 * theta)) / gravity;
  const levelTheoreticalFlightTime = (2 * v0 * Math.sin(theta)) / gravity;
  return {
    speed,
    horizontalRange,
    altitude: Math.max(0, state.y - state.params.groundY - state.params.radius),
    maxHeight: state.maxHeight,
    flightTime: state.time,
    levelTheoreticalRange,
    levelTheoreticalFlightTime,
    status: state.status,
    impactEvent: state.impactEvent,
    shotsFired: state.shotsFired,
    hits: state.hits,
  };
}

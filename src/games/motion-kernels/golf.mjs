/**
 * Golf Physics kernel (3D flat green, Y-up, SI units).
 * Fixed timestep rolling friction and speed-gated hole capture.
 */

export const GOLF_DT = 1 / 120;

export const GOLF_DEFAULTS = Object.freeze({
  mass: 0.0459,
  radius: 0.02135,
  muR: 0.04,
  gravity: 9.81,
  maxShotSpeed: 4.0,
  holePosition: Object.freeze({ x: 4.0, z: 0.0 }),
  holeCaptureRadius: 0.04,
  holeMaxSpeed: 0.5,
  startPosition: Object.freeze({ x: 0.0, z: 0.0 }),
});

export function clampGolfParams(raw = {}) {
  const mass = clampNumber(raw.mass ?? GOLF_DEFAULTS.mass, 0.03, 0.08);
  const radius = clampNumber(raw.radius ?? GOLF_DEFAULTS.radius, 0.015, 0.04);
  const muR = clampNumber(raw.muR ?? GOLF_DEFAULTS.muR, 0.01, 0.1);
  const gravity = clampNumber(raw.gravity ?? GOLF_DEFAULTS.gravity, 1.0, 20.0);
  const holeCaptureRadius = clampNumber(
    raw.holeCaptureRadius ?? GOLF_DEFAULTS.holeCaptureRadius,
    0.02,
    0.1,
  );
  const holeMaxSpeed = clampNumber(
    raw.holeMaxSpeed ?? GOLF_DEFAULTS.holeMaxSpeed,
    0.1,
    2.0,
  );
  return { mass, radius, muR, gravity, holeCaptureRadius, holeMaxSpeed };
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

export function createGolfState(options = {}) {
  const params = clampGolfParams(options.params ?? options);
  const start = options.startPosition ?? GOLF_DEFAULTS.startPosition;
  const hole = options.holePosition ?? GOLF_DEFAULTS.holePosition;
  return {
    mode: options.mode === "simulation" ? "simulation" : "game",
    params,
    x: Number(start.x ?? 0),
    y: params.radius,
    z: Number(start.z ?? 0),
    vx: 0,
    vz: 0,
    spinX: 0,
    spinZ: 0,
    rollAngleX: 0,
    rollAngleZ: 0,
    time: 0,
    stopTime: null,
    shotStartTime: 0,
    distanceTraveled: 0,
    shotDistance: 0,
    strokes: 0,
    par: options.par ?? 2,
    holePosition: { x: Number(hole.x ?? 4), z: Number(hole.z ?? 0) },
    bounds: options.bounds ?? null,
    status: "ready",
    capturedInShot: false,
    missedHoleSpeed: null,
    lastShotSpeed: 0,
    lastShotAngleDeg: 0,
    trail: [{ x: Number(start.x ?? 0), z: Number(start.z ?? 0) }],
  };
}

export function strikeGolfBall(state, speed, angleDeg = 0) {
  if (state.status === "holed") return state;
  const clampedSpeed = clampNumber(speed, 0, GOLF_DEFAULTS.maxShotSpeed);
  const rad = (Number(angleDeg) * Math.PI) / 180;
  state.vx = clampedSpeed * Math.cos(rad);
  state.vz = clampedSpeed * Math.sin(rad);
  state.strokes += 1;
  state.shotStartTime = state.time;
  state.stopTime = null;
  state.shotDistance = 0;
  state.capturedInShot = false;
  state.missedHoleSpeed = null;
  state.lastShotSpeed = clampedSpeed;
  state.lastShotAngleDeg = Number(angleDeg) || 0;
  state.status = clampedSpeed > 1e-4 ? "rolling" : "stopped";
  state.trail = [{ x: state.x, z: state.z }];
  return state;
}

function closestPointFractionOnSegment(ax, az, bx, bz, px, pz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq <= 1e-12) return 0;
  const t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  return Math.min(1, Math.max(0, t));
}

export function stepGolf(state, dt = GOLF_DT) {
  if (state.status !== "rolling") return state;

  const { muR, gravity, holeCaptureRadius, holeMaxSpeed, radius } =
    state.params;
  const speedBefore = Math.hypot(state.vx, state.vz);
  if (speedBefore <= 1e-6) {
    state.vx = 0;
    state.vz = 0;
    state.status = "stopped";
    state.stopTime = state.time;
    return state;
  }

  const decel = muR * gravity;
  const dv = decel * dt;
  const stopsThisTick = speedBefore <= dv;
  const stepDt = stopsThisTick ? speedBefore / decel : dt;

  const scale = stopsThisTick ? 0 : Math.max(0, 1 - dv / speedBefore);
  const vxAfter = state.vx * scale;
  const vzAfter = state.vz * scale;

  // Trapezoidal position step over stepDt matches analytic stopping distance.
  const vxAvg = 0.5 * (state.vx + vxAfter);
  const vzAvg = 0.5 * (state.vz + vzAfter);
  const prevX = state.x;
  const prevZ = state.z;
  let nextX = prevX + vxAvg * stepDt;
  let nextZ = prevZ + vzAvg * stepDt;

  // Hole capture / roll-over check along swept segment.
  const hx = state.holePosition.x;
  const hz = state.holePosition.z;
  const frac = closestPointFractionOnSegment(prevX, prevZ, nextX, nextZ, hx, hz);
  const cx = prevX + (nextX - prevX) * frac;
  const cz = prevZ + (nextZ - prevZ) * frac;
  const distToHole = Math.hypot(cx - hx, cz - hz);
  const speedAtClosest =
    speedBefore + (Math.hypot(vxAfter, vzAfter) - speedBefore) * frac;

  if (!state.capturedInShot && distToHole <= holeCaptureRadius) {
    if (speedAtClosest <= holeMaxSpeed) {
      const segDist = Math.hypot(cx - prevX, cz - prevZ);
      state.x = hx;
      state.z = hz;
      state.y = radius;
      state.vx = 0;
      state.vz = 0;
      state.distanceTraveled += segDist;
      state.shotDistance += segDist;
      state.time += stepDt * frac;
      state.stopTime = state.time;
      state.capturedInShot = true;
      state.status = "holed";
      state.trail.push({ x: hx, z: hz });
      return state;
    }
    if (state.missedHoleSpeed === null) {
      state.missedHoleSpeed = speedAtClosest;
    }
  }

  // Optional green wall bounds in Game Mode with gentle rebound.
  if (state.bounds) {
    const { minX, maxX, minZ, maxZ, restitution = 0.55 } = state.bounds;
    if (nextX - radius < minX) {
      nextX = minX + radius;
      state.vx = Math.abs(state.vx) * restitution;
    } else if (nextX + radius > maxX) {
      nextX = maxX - radius;
      state.vx = -Math.abs(state.vx) * restitution;
    }
    if (nextZ - radius < minZ) {
      nextZ = minZ + radius;
      state.vz = Math.abs(state.vz) * restitution;
    } else if (nextZ + radius > maxZ) {
      nextZ = maxZ - radius;
      state.vz = -Math.abs(state.vz) * restitution;
    }
  }

  const segDist = Math.hypot(nextX - prevX, nextZ - prevZ);
  state.x = nextX;
  state.z = nextZ;
  state.y = radius;
  state.distanceTraveled += segDist;
  state.shotDistance += segDist;

  if (!state.bounds || (nextX > state.bounds.minX + radius && nextX < state.bounds.maxX - radius)) {
    state.vx = vxAfter;
  }
  if (!state.bounds || (nextZ > state.bounds.minZ + radius && nextZ < state.bounds.maxZ - radius)) {
    state.vz = vzAfter;
  }

  const avgSpeed = Math.hypot(vxAvg, vzAvg);
  if (avgSpeed > 1e-6 && radius > 0) {
    state.rollAngleZ -= (vxAvg * stepDt) / radius;
    state.rollAngleX += (vzAvg * stepDt) / radius;
  }

  state.time += stepDt;

  if (stopsThisTick || Math.hypot(state.vx, state.vz) <= 1e-4) {
    state.vx = 0;
    state.vz = 0;
    state.status = "stopped";
    state.stopTime = state.time;
  }

  const lastTrail = state.trail[state.trail.length - 1];
  if (
    !lastTrail ||
    Math.hypot(state.x - lastTrail.x, state.z - lastTrail.z) >= 0.08
  ) {
    state.trail.push({ x: state.x, z: state.z });
  }

  return state;
}

export function getGolfTelemetry(state) {
  const speed = Math.hypot(state.vx, state.vz);
  const { mass, muR, gravity } = state.params;
  const kineticEnergy = 0.5 * mass * speed * speed;
  const rollingDragForce = speed > 1e-5 ? muR * mass * gravity : 0;
  const distanceToHole = Math.hypot(
    state.holePosition.x - state.x,
    state.holePosition.z - state.z,
  );
  const v0 = state.lastShotSpeed;
  const theoreticalStopDistance = (v0 * v0) / (2 * muR * gravity);
  const theoreticalStopTime = v0 / (muR * gravity);
  return {
    speed,
    distanceTraveled: state.distanceTraveled,
    shotDistance: state.shotDistance,
    distanceToHole,
    kineticEnergy,
    rollingDragForce,
    theoreticalStopDistance,
    theoreticalStopTime,
    strokes: state.strokes,
    status: state.status,
    missedHoleSpeed: state.missedHoleSpeed,
  };
}

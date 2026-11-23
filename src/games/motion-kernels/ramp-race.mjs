/**
 * Ramp Race kernel (3D twin inclined planes, Y up, SI units).
 * Solid sphere rotational inertia I = (2/5) * m * r^2.
 */

export const RAMP_DT = 1 / 120;
export const SOLID_SPHERE_K = 2 / 5;

export const RAMP_DEFAULTS = Object.freeze({
  slopeDeg: 20,
  length: 3.0,
  gravity: 9.81,
  laneOffset: 0.55,
  ballA: Object.freeze({ mass: 1.0, radius: 0.1, mu: 0.5, restitution: 0 }),
  ballB: Object.freeze({ mass: 2.5, radius: 0.08, mu: 0.05, restitution: 0 }),
});

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

export function clampBallParams(raw = {}, fallback = RAMP_DEFAULTS.ballA) {
  return {
    mass: clampNumber(raw.mass ?? fallback.mass, 0.1, 5),
    radius: clampNumber(raw.radius ?? fallback.radius, 0.05, 0.15),
    mu: clampNumber(raw.mu ?? fallback.mu, 0, 1),
    restitution: clampNumber(raw.restitution ?? fallback.restitution ?? 0, 0, 0.9),
  };
}

export function clampRampParams(raw = {}) {
  return {
    slopeDeg: clampNumber(raw.slopeDeg ?? RAMP_DEFAULTS.slopeDeg, 5, 35),
    length: clampNumber(raw.length ?? RAMP_DEFAULTS.length, 1.5, 6),
    gravity: clampNumber(raw.gravity ?? RAMP_DEFAULTS.gravity, 1, 20),
    laneOffset: clampNumber(raw.laneOffset ?? RAMP_DEFAULTS.laneOffset, 0.3, 1.2),
  };
}

function createBallState(id, params, zLane, slopeRad, length, gravity) {
  const s = 0;
  const h = length * Math.sin(slopeRad);
  const potentialEnergy = params.mass * gravity * h;
  return {
    id,
    params,
    zLane,
    s,
    v: 0,
    omega: 0,
    spinAngle: 0,
    a: 0,
    alpha: 0,
    regime: "ready",
    finished: false,
    finishTime: null,
    initialEnergy: potentialEnergy,
  };
}

export function createRampRaceState(options = {}) {
  const ramp = clampRampParams(options.ramp ?? options);
  const ballAParams = clampBallParams(options.ballA, RAMP_DEFAULTS.ballA);
  const ballBParams = clampBallParams(options.ballB, RAMP_DEFAULTS.ballB);
  const slopeRad = (ramp.slopeDeg * Math.PI) / 180;

  return {
    mode: options.mode === "simulation" ? "simulation" : "game",
    ramp,
    slopeRad,
    time: 0,
    status: "ready",
    winner: null,
    ballA: createBallState(
      "A",
      ballAParams,
      -ramp.laneOffset,
      slopeRad,
      ramp.length,
      ramp.gravity,
    ),
    ballB: createBallState(
      "B",
      ballBParams,
      ramp.laneOffset,
      slopeRad,
      ramp.length,
      ramp.gravity,
    ),
  };
}

export function startRampRace(state) {
  if (state.status !== "ready") return state;
  state.status = "racing";
  return state;
}

export function criticalFrictionForSolidSphere(slopeRad) {
  return (SOLID_SPHERE_K / (1 + SOLID_SPHERE_K)) * Math.tan(slopeRad);
}

function computeInclineDynamics(ball, slopeRad, gravity) {
  const { mu, radius } = ball.params;
  const sinT = Math.sin(slopeRad);
  const cosT = Math.cos(slopeRad);
  const muCrit = criticalFrictionForSolidSphere(slopeRad);
  const vSlip = ball.v - ball.omega * radius;

  if (mu <= 1e-8) {
    return {
      a: gravity * sinT,
      alpha: 0,
      regime: "sliding",
      pureRolling: false,
    };
  }

  if (Math.abs(vSlip) <= 1e-6 && mu >= muCrit - 1e-9) {
    const aRoll = (gravity * sinT) / (1 + SOLID_SPHERE_K);
    return {
      a: aRoll,
      alpha: aRoll / radius,
      regime: "rolling",
      pureRolling: true,
    };
  }

  // Sliding / coupled friction phase until v === omega * r (if mu >= muCrit).
  const dir = vSlip >= 0 ? 1 : -1;
  const aSlip = gravity * (sinT - dir * mu * cosT);
  const alphaSlip = (dir * mu * gravity * cosT) / (SOLID_SPHERE_K * radius);
  return {
    a: aSlip,
    alpha: alphaSlip,
    regime: "slipping",
    pureRolling: false,
  };
}

function solveQuadraticPositiveRoot(halfA, v0, deltaS) {
  // 0.5 * a * t^2 + v0 * t - deltaS = 0
  if (Math.abs(halfA) <= 1e-10) {
    return v0 > 1e-9 ? deltaS / v0 : 0;
  }
  const disc = Math.max(0, v0 * v0 + 4 * halfA * deltaS);
  return (-v0 + Math.sqrt(disc)) / (2 * halfA);
}

function stepSingleBall(ball, ramp, slopeRad, currentTime, dt) {
  if (ball.finished) return;

  const { length, gravity } = ramp;
  const { radius, mu } = ball.params;
  const muCrit = criticalFrictionForSolidSphere(slopeRad);
  const dyn = computeInclineDynamics(ball, slopeRad, gravity);

  const prevS = ball.s;
  const prevV = ball.v;
  const prevOmega = ball.omega;

  let nextS, nextV, nextOmega;

  if (!dyn.pureRolling && mu >= muCrit - 1e-9 && mu > 1e-8) {
    const vSlipStart = prevV - prevOmega * radius;
    const aSlipRate = dyn.a - dyn.alpha * radius;
    const vSlipEnd = vSlipStart + aSlipRate * dt;
    if (
      Math.abs(aSlipRate) > 1e-9 &&
      vSlipStart * vSlipEnd <= 0
    ) {
      const tLock = clampNumber(-vSlipStart / aSlipRate, 0, dt);
      const sLock = prevS + prevV * tLock + 0.5 * dyn.a * tLock * tLock;
      const vLock = prevV + dyn.a * tLock;
      const remDt = dt - tLock;
      const aRoll = (gravity * Math.sin(slopeRad)) / (1 + SOLID_SPHERE_K);
      nextS = sLock + vLock * remDt + 0.5 * aRoll * remDt * remDt;
      nextV = vLock + aRoll * remDt;
      nextOmega = nextV / radius;
      ball.regime = "rolling";
      ball.a = aRoll;
      ball.alpha = aRoll / radius;
    } else {
      nextS = prevS + prevV * dt + 0.5 * dyn.a * dt * dt;
      nextV = prevV + dyn.a * dt;
      nextOmega = prevOmega + dyn.alpha * dt;
      ball.regime = dyn.regime;
      ball.a = dyn.a;
      ball.alpha = dyn.alpha;
    }
  } else {
    nextS = prevS + prevV * dt + 0.5 * dyn.a * dt * dt;
    nextV = prevV + dyn.a * dt;
    nextOmega = dyn.pureRolling ? nextV / radius : prevOmega + dyn.alpha * dt;
    ball.regime = dyn.regime;
    ball.a = dyn.a;
    ball.alpha = dyn.alpha;
  }

  ball.spinAngle += 0.5 * (prevOmega + nextOmega) * dt;

  if (nextS >= length) {
    const tCross = clampNumber(
      solveQuadraticPositiveRoot(0.5 * ball.a, prevV, length - prevS),
      0,
      dt,
    );
    const vFinish = prevV + ball.a * tCross;
    ball.s = length;
    ball.v = vFinish;
    ball.omega = dyn.pureRolling ? vFinish / radius : prevOmega + ball.alpha * tCross;
    ball.finished = true;
    ball.finishTime = currentTime + tCross;
    return;
  }

  ball.s = nextS;
  ball.v = nextV;
  ball.omega = nextOmega;
}

export function stepRampRace(state, dt = RAMP_DT) {
  if (state.status !== "racing") return state;

  stepSingleBall(state.ballA, state.ramp, state.slopeRad, state.time, dt);
  stepSingleBall(state.ballB, state.ramp, state.slopeRad, state.time, dt);
  state.time += dt;

  if (state.ballA.finished && state.ballB.finished) {
    const diff = state.ballA.finishTime - state.ballB.finishTime;
    if (Math.abs(diff) <= dt + 1e-9) {
      state.winner = "tie";
    } else {
      state.winner = diff < 0 ? "A" : "B";
    }
    state.status = "finished";
  }

  return state;
}

export function getBallWorldPosition(ball, ramp, slopeRad) {
  const { radius } = ball.params;
  const distRemaining = Math.max(0, ramp.length - ball.s);
  const cosT = Math.cos(slopeRad);
  const sinT = Math.sin(slopeRad);
  // Ramp surface meets ground at finish x = ramp.length * cos(slopeRad).
  // Ball center is offset perpendicular to surface by +radius.
  const surfX = ball.s * cosT;
  const surfY = distRemaining * sinT;
  return {
    x: surfX + radius * sinT,
    y: surfY + radius * cosT,
    z: ball.zLane,
  };
}

export function getBallTelemetry(ball, ramp, slopeRad) {
  const { mass, radius } = ball.params;
  const height = Math.max(0, (ramp.length - ball.s) * Math.sin(slopeRad));
  const potentialEnergy = mass * ramp.gravity * height;
  const translationalKE = 0.5 * mass * ball.v * ball.v;
  const inertia = SOLID_SPHERE_K * mass * radius * radius;
  const rotationalKE = 0.5 * inertia * ball.omega * ball.omega;
  const totalEnergy = potentialEnergy + translationalKE + rotationalKE;
  const energyDriftRatio =
    ball.initialEnergy > 1e-9
      ? Math.abs(totalEnergy - ball.initialEnergy) / ball.initialEnergy
      : 0;

  return {
    s: ball.s,
    v: ball.v,
    omega: ball.omega,
    rOmega: radius * ball.omega,
    slipDelta: Math.abs(ball.v - radius * ball.omega),
    a: ball.a,
    regime: ball.regime,
    potentialEnergy,
    translationalKE,
    rotationalKE,
    totalEnergy,
    energyDriftRatio,
    finished: ball.finished,
    finishTime: ball.finishTime,
  };
}

export function getRampRaceTelemetry(state) {
  return {
    time: state.time,
    status: state.status,
    winner: state.winner,
    criticalMu: criticalFrictionForSolidSphere(state.slopeRad),
    ballA: getBallTelemetry(state.ballA, state.ramp, state.slopeRad),
    ballB: getBallTelemetry(state.ballB, state.ramp, state.slopeRad),
  };
}

/**
 * Rocket Landing kernel (2D vertical plane, X right, Y up, SI units).
 * theta = 0 points along +Y, CCW positive: thrust unit vector is (-sin(theta), cos(theta)).
 */

export const ROCKET_DT = 1 / 120;

export const ROCKET_DEFAULTS = Object.freeze({
  dryMass: 100,
  fuelMass: 20,
  maxThrust: 2000,
  maxFuelFlow: 1.0,
  inertia: 100,
  maxTorque: 100,
  gravity: 9.81,
  legOffset: 1.5,
  footHalfSpan: 0.9,
  padCenterX: 0,
  padHalfWidth: 3.5,
  padY: 0,
  startX: -4,
  startY: 26,
  startVx: 1.2,
  startVy: -1.5,
  startTheta: 0.08,
  startOmega: 0,
});

export const LANDING_LIMITS = Object.freeze({
  maxAbsVy: 2.0,
  maxAbsVx: 1.0,
  maxAbsThetaRad: (5 * Math.PI) / 180,
  maxAbsOmega: 0.2,
});

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

export function clampRocketParams(raw = {}) {
  return {
    dryMass: clampNumber(raw.dryMass ?? ROCKET_DEFAULTS.dryMass, 40, 300),
    initialFuelMass: clampNumber(
      raw.fuelMass ?? raw.initialFuelMass ?? ROCKET_DEFAULTS.fuelMass,
      0,
      50,
    ),
    maxThrust: clampNumber(
      raw.maxThrust ?? ROCKET_DEFAULTS.maxThrust,
      1000,
      4000,
    ),
    maxFuelFlow: clampNumber(
      raw.maxFuelFlow ?? ROCKET_DEFAULTS.maxFuelFlow,
      0,
      5,
    ),
    inertia: clampNumber(raw.inertia ?? ROCKET_DEFAULTS.inertia, 20, 400),
    maxTorque: clampNumber(raw.maxTorque ?? ROCKET_DEFAULTS.maxTorque, 20, 300),
    gravity: clampNumber(raw.gravity ?? ROCKET_DEFAULTS.gravity, 1, 20),
    legOffset: clampNumber(raw.legOffset ?? ROCKET_DEFAULTS.legOffset, 0.5, 4),
    footHalfSpan: clampNumber(
      raw.footHalfSpan ?? ROCKET_DEFAULTS.footHalfSpan,
      0.2,
      2.5,
    ),
    padCenterX: Number(raw.padCenterX ?? ROCKET_DEFAULTS.padCenterX),
    padHalfWidth: clampNumber(
      raw.padHalfWidth ?? ROCKET_DEFAULTS.padHalfWidth,
      1.5,
      8,
    ),
    padY: Number(raw.padY ?? ROCKET_DEFAULTS.padY),
  };
}

export function createRocketState(options = {}) {
  const params = clampRocketParams(options.params ?? options);
  const startY =
    options.y ??
    (options.altitude !== undefined
      ? params.padY + params.legOffset + Number(options.altitude)
      : ROCKET_DEFAULTS.startY);

  return {
    mode: options.mode === "simulation" ? "simulation" : "game",
    params,
    x: Number(options.x ?? ROCKET_DEFAULTS.startX),
    y: Number(startY),
    vx: Number(options.vx ?? ROCKET_DEFAULTS.startVx),
    vy: Number(options.vy ?? ROCKET_DEFAULTS.startVy),
    theta: Number(options.theta ?? ROCKET_DEFAULTS.startTheta),
    omega: Number(options.omega ?? ROCKET_DEFAULTS.startOmega),
    fuelMass: params.initialFuelMass,
    throttle: clampNumber(options.throttle ?? 0, 0, 1),
    torqueInput: clampNumber(options.torqueInput ?? 0, -1, 1),
    currentThrust: 0,
    time: 0,
    status: "flying",
    contactTelemetry: null,
    crashReasons: [],
    trail: [],
  };
}

export function evaluateLanding(contact, params) {
  const reasons = [];
  const leftFootX = contact.x - params.footHalfSpan * Math.cos(contact.theta);
  const rightFootX = contact.x + params.footHalfSpan * Math.cos(contact.theta);
  const padMinX = params.padCenterX - params.padHalfWidth;
  const padMaxX = params.padCenterX + params.padHalfWidth;
  const bothFeetOnPad = leftFootX >= padMinX && rightFootX <= padMaxX;

  if (!bothFeetOnPad) reasons.push("outside-pad");
  if (Math.abs(contact.vy) > LANDING_LIMITS.maxAbsVy)
    reasons.push("vertical-speed");
  if (Math.abs(contact.vx) > LANDING_LIMITS.maxAbsVx)
    reasons.push("horizontal-speed");
  if (Math.abs(contact.theta) > LANDING_LIMITS.maxAbsThetaRad)
    reasons.push("tilt-angle");
  if (Math.abs(contact.omega) > LANDING_LIMITS.maxAbsOmega)
    reasons.push("angular-rate");

  return { safe: reasons.length === 0, reasons, bothFeetOnPad };
}

export function stepRocket(state, input = {}, dt = ROCKET_DT) {
  if (state.status !== "flying") return state;

  const {
    dryMass,
    maxThrust,
    maxFuelFlow,
    inertia,
    maxTorque,
    gravity,
    legOffset,
    padY,
  } = state.params;

  const throttle = clampNumber(input.throttle ?? state.throttle ?? 0, 0, 1);
  const torqueInput = clampNumber(
    input.torqueCommand ?? input.torqueInput ?? state.torqueInput ?? 0,
    -1,
    1,
  );
  state.throttle = throttle;
  state.torqueInput = torqueInput;

  const fuelBefore = Math.max(0, state.fuelMass);
  const desiredBurn = throttle * maxFuelFlow * dt;
  let actualBurn = 0;
  let thrust = 0;

  if (throttle > 0) {
    if (desiredBurn > 0) {
      actualBurn = Math.min(fuelBefore, desiredBurn);
      const burnFraction = actualBurn / desiredBurn;
      thrust = throttle * maxThrust * burnFraction;
    } else {
      // Allows deterministic mass-constant hover/thrust fixtures when maxFuelFlow = 0.
      thrust = throttle * maxThrust;
    }
  }

  const fuelAfter = Math.max(0, fuelBefore - actualBurn);
  const effectiveMass = dryMass + 0.5 * (fuelBefore + fuelAfter);

  const prevX = state.x;
  const prevY = state.y;
  const prevVx = state.vx;
  const prevVy = state.vy;
  const prevTheta = state.theta;
  const prevOmega = state.omega;

  const alpha = (torqueInput * maxTorque) / inertia;
  const thetaMid = prevTheta + prevOmega * 0.5 * dt + 0.125 * alpha * dt * dt;
  const thetaNext = prevTheta + prevOmega * dt + 0.5 * alpha * dt * dt;
  const omegaNext = prevOmega + alpha * dt;

  const ux = -Math.sin(thetaMid);
  const uy = Math.cos(thetaMid);
  const ax = (thrust * ux) / effectiveMass;
  const ay = (thrust * uy) / effectiveMass - gravity;

  const nextX = prevX + prevVx * dt + 0.5 * ax * dt * dt;
  const nextY = prevY + prevVy * dt + 0.5 * ay * dt * dt;
  const nextVx = prevVx + ax * dt;
  const nextVy = prevVy + ay * dt;

  state.fuelMass = fuelAfter;
  state.currentThrust = thrust;

  const prevFootY = prevY - legOffset;
  const nextFootY = nextY - legOffset;

  if (nextFootY <= padY) {
    const denom = prevFootY - nextFootY;
    const tFrac =
      denom > 1e-9 ? clampNumber((prevFootY - padY) / denom, 0, 1) : 1;
    const contact = {
      x: prevX + (nextX - prevX) * tFrac,
      y: padY + legOffset,
      vx: prevVx + (nextVx - prevVx) * tFrac,
      vy: prevVy + (nextVy - prevVy) * tFrac,
      theta: prevTheta + (thetaNext - prevTheta) * tFrac,
      omega: prevOmega + (omegaNext - prevOmega) * tFrac,
      time: state.time + dt * tFrac,
    };
    const verdict = evaluateLanding(contact, state.params);

    state.x = contact.x;
    state.y = contact.y;
    state.vx = 0;
    state.vy = 0;
    state.theta = contact.theta;
    state.omega = 0;
    state.time = contact.time;
    state.currentThrust = 0;
    state.status = verdict.safe ? "landed" : "crashed";
    state.crashReasons = verdict.reasons;
    state.contactTelemetry = contact;
    return state;
  }

  state.x = nextX;
  state.y = nextY;
  state.vx = nextVx;
  state.vy = nextVy;
  state.theta = thetaNext;
  state.omega = omegaNext;
  state.time += dt;

  return state;
}

export function getRocketTelemetry(state) {
  const { dryMass, gravity, legOffset, padY } = state.params;
  const totalMass = dryMass + state.fuelMass;
  const weight = totalMass * gravity;
  const altitude = Math.max(0, state.y - legOffset - padY);
  const speed = Math.hypot(state.vx, state.vy);
  const thetaDeg = (state.theta * 180) / Math.PI;
  const hoverThrottle = Math.min(1, weight / state.params.maxThrust);
  return {
    altitude,
    vx: state.vx,
    vy: state.vy,
    speed,
    thetaDeg,
    omega: state.omega,
    fuelMass: state.fuelMass,
    totalMass,
    thrust: state.currentThrust,
    weight,
    netVerticalForce:
      state.currentThrust * Math.cos(state.theta) - weight,
    hoverThrottle,
    status: state.status,
    contactTelemetry: state.contactTelemetry,
    crashReasons: state.crashReasons,
  };
}

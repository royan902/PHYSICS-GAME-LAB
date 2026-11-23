import { describe, expect, it } from "vitest";
import {
  GOLF_DT,
  createGolfState,
  getGolfTelemetry,
  stepGolf,
  strikeGolfBall,
} from "../../src/games/motion-kernels/golf.mjs";
import {
  ROCKET_DT,
  createRocketState,
  getRocketTelemetry,
  stepRocket,
} from "../../src/games/motion-kernels/rocket-landing.mjs";
import {
  CANNON_DT,
  createCannonState,
  fireCannon,
  getCannonTelemetry,
  stepCannon,
} from "../../src/games/motion-kernels/cannon.mjs";
import {
  RAMP_DT,
  createRampRaceState,
  getRampRaceTelemetry,
  startRampRace,
  stepRampRace,
} from "../../src/games/motion-kernels/ramp-race.mjs";

function runSteps(fn: () => void, count: number) {
  for (let i = 0; i < count; i += 1) fn();
}

describe("Golf Physics kernel", () => {
  it("matches analytic stopping time and distance within tolerance", () => {
    const v0 = 2.5;
    const muR = 0.04;
    const g = 9.81;
    const state = createGolfState({
      mass: 0.0459,
      muR,
      gravity: g,
      holePosition: { x: 20, z: 0 },
    });
    strikeGolfBall(state, v0, 0);

    runSteps(() => stepGolf(state, GOLF_DT), 1500);

    const expectedTime = v0 / (muR * g);
    const expectedDist = (v0 * v0) / (2 * muR * g);
    const distTol = expectedDist * 0.02 + 0.005;

    expect(state.status).toBe("stopped");
    expect(Math.abs(state.x - expectedDist)).toBeLessThanOrEqual(distTol);
    expect(Math.abs((state.stopTime ?? 0) - expectedTime)).toBeLessThanOrEqual(
      0.03,
    );
  });

  it("keeps stopping distance independent of ball mass for equal v0", () => {
    const light = createGolfState({
      mass: 0.03,
      muR: 0.05,
      holePosition: { x: 25, z: 0 },
    });
    const heavy = createGolfState({
      mass: 0.08,
      muR: 0.05,
      holePosition: { x: 25, z: 0 },
    });
    strikeGolfBall(light, 2.0, 0);
    strikeGolfBall(heavy, 2.0, 0);

    runSteps(() => {
      stepGolf(light, GOLF_DT);
      stepGolf(heavy, GOLF_DT);
    }, 1000);

    expect(Math.abs(light.x - heavy.x)).toBeLessThanOrEqual(1e-6);
  });

  it("captures inside hole only when speed <= 0.5 m/s and triggers once", () => {
    const slow = createGolfState({
      muR: 0.04,
      holePosition: { x: 1.0, z: 0 },
      holeCaptureRadius: 0.04,
      holeMaxSpeed: 0.5,
    });
    // Exact v0 so arrival speed at x=1.0 is ~0.35 m/s
    const vSlow = Math.sqrt(2 * 0.04 * 9.81 * 1.0 + 0.35 * 0.35);
    strikeGolfBall(slow, vSlow, 0);
    runSteps(() => stepGolf(slow, GOLF_DT), 600);
    expect(slow.status).toBe("holed");
    expect(slow.capturedInShot).toBe(true);

    const fast = createGolfState({
      muR: 0.04,
      holePosition: { x: 1.0, z: 0 },
      holeCaptureRadius: 0.04,
      holeMaxSpeed: 0.5,
    });
    strikeGolfBall(fast, 3.2, 0);
    runSteps(() => stepGolf(fast, GOLF_DT), 1200);
    expect(fast.status).toBe("stopped");
    expect(fast.capturedInShot).toBe(false);
    expect(fast.missedHoleSpeed).toBeGreaterThan(0.5);
    expect(getGolfTelemetry(fast).distanceTraveled).toBeGreaterThan(5);
  });
});

describe("Rocket Landing kernel", () => {
  it("matches analytic 2 s free fall within tight tolerances", () => {
    const state = createRocketState({
      x: 0,
      y: 100,
      vx: 0,
      vy: 0,
      theta: 0,
      omega: 0,
      fuelMass: 20,
      gravity: 9.81,
    });
    const steps = 240; // 2 s at 1/120 s
    runSteps(() => stepRocket(state, { throttle: 0, torqueCommand: 0 }, ROCKET_DT), steps);

    const expectedY = 100 - 0.5 * 9.81 * 2 * 2;
    const expectedVy = -9.81 * 2;
    expect(Math.abs(state.y - expectedY)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(state.vy - expectedVy)).toBeLessThanOrEqual(0.01);
  });

  it("maintains ideal hover equilibrium when thrust equals weight", () => {
    const totalMass = 120;
    const g = 9.81;
    const maxThrust = 2000;
    const hoverThrottle = (totalMass * g) / maxThrust;
    const state = createRocketState({
      x: 0,
      y: 30,
      vx: 0,
      vy: 0,
      theta: 0,
      omega: 0,
      dryMass: 100,
      fuelMass: 20,
      maxThrust,
      maxFuelFlow: 0,
      gravity: g,
    });

    runSteps(
      () => stepRocket(state, { throttle: hoverThrottle, torqueCommand: 0 }, ROCKET_DT),
      600, // 5 seconds
    );

    expect(Math.hypot(state.vx, state.vy)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(state.y - 30)).toBeLessThanOrEqual(0.01);
  });

  it("clamps fuel burn cleanly, prevents negative fuel, and applies zero thrust at empty", () => {
    const state = createRocketState({
      x: 0,
      y: 50,
      vx: 0,
      vy: 0,
      theta: 0,
      dryMass: 100,
      fuelMass: 0.05,
      maxThrust: 2000,
      maxFuelFlow: 1.0,
    });
    runSteps(() => stepRocket(state, { throttle: 1, torqueCommand: 0 }, ROCKET_DT), 30);

    expect(state.fuelMass).toBe(0);
    expect(state.currentThrust).toBe(0);
    expect(getRocketTelemetry(state).totalMass).toBe(100);
  });

  it("distinguishes safe landing vs speed/angle/pad-edge crashes", () => {
    const safe = createRocketState({
      x: 1.2,
      y: 1.55,
      vx: 0.4,
      vy: -1.0,
      theta: 0.03,
      omega: 0.05,
      padHalfWidth: 3.5,
    });
    runSteps(() => stepRocket(safe, { throttle: 0, torqueCommand: 0 }, ROCKET_DT), 60);
    expect(safe.status).toBe("landed");

    const tooFast = createRocketState({
      x: 0,
      y: 2.0,
      vx: 0,
      vy: -2.6,
      theta: 0,
      omega: 0,
    });
    runSteps(() => stepRocket(tooFast, { throttle: 0, torqueCommand: 0 }, ROCKET_DT), 60);
    expect(tooFast.status).toBe("crashed");
    expect(tooFast.crashReasons).toContain("vertical-speed");

    const edgeMiss = createRocketState({
      x: 3.1, // right foot = 3.1 + 0.9 = 4.0 > 3.5
      y: 1.6,
      vx: 0,
      vy: -1.0,
      theta: 0,
      omega: 0,
      padHalfWidth: 3.5,
      footHalfSpan: 0.9,
    });
    runSteps(() => stepRocket(edgeMiss, { throttle: 0, torqueCommand: 0 }, ROCKET_DT), 60);
    expect(edgeMiss.status).toBe("crashed");
    expect(edgeMiss.crashReasons).toContain("outside-pad");
  });
});

describe("Cannon Physics kernel", () => {
  it("matches analytic projectile trajectory and level ground range within tolerance", () => {
    const v0 = 20;
    const elevationDeg = 45;
    const g = 9.81;
    const state = createCannonState({
      v0,
      elevationDeg,
      azimuthDeg: 0,
      gravity: g,
      mass: 1,
      dragEnabled: false,
      levelLaunch: true,
      target: { x: 100, y: 10, z: 0, radius: 0.5 },
    });
    fireCannon(state);

    // Check trajectory at t = 2 s
    runSteps(() => stepCannon(state, CANNON_DT), 240);
    const theta = (elevationDeg * Math.PI) / 180;
    const t2 = 2;
    const expectedX2 = v0 * Math.cos(theta) * t2;
    const expectedY2 = state.origin.y + v0 * Math.sin(theta) * t2 - 0.5 * g * t2 * t2;
    expect(Math.abs(state.x - expectedX2)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(state.y - expectedY2)).toBeLessThanOrEqual(0.1);

    // Continue until ground landing
    runSteps(() => stepCannon(state, CANNON_DT), 600);
    const expectedRange = (v0 * v0 * Math.sin(2 * theta)) / g;
    const expectedFlightTime = (2 * v0 * Math.sin(theta)) / g;

    const impact = state.impactEvent as unknown as {
      type: string;
      range: number;
      time: number;
    };
    expect(state.status).toBe("landed");
    expect(Math.abs(impact.range - expectedRange)).toBeLessThanOrEqual(
      expectedRange * 0.01 + 0.05,
    );
    expect(Math.abs(impact.time - expectedFlightTime)).toBeLessThanOrEqual(
      0.03,
    );
  });

  it("is mass-independent when drag is disabled and emits one target hit", () => {
    const light = createCannonState({
      mass: 0.2,
      v0: 25,
      elevationDeg: 35,
      dragEnabled: false,
      levelLaunch: true,
      target: { x: 200, y: 10, z: 0, radius: 0.5 },
    });
    const heavy = createCannonState({
      mass: 8.0,
      v0: 25,
      elevationDeg: 35,
      dragEnabled: false,
      levelLaunch: true,
      target: { x: 200, y: 10, z: 0, radius: 0.5 },
    });
    fireCannon(light);
    fireCannon(heavy);
    runSteps(() => {
      stepCannon(light, CANNON_DT);
      stepCannon(heavy, CANNON_DT);
    }, 600);

    const lightImpact = light.impactEvent as unknown as { range: number };
    const heavyImpact = heavy.impactEvent as unknown as { range: number };
    expect(Math.abs(lightImpact.range - heavyImpact.range)).toBeLessThanOrEqual(
      1e-9,
    );

    const hunter = createCannonState({
      v0: 20,
      elevationDeg: 45,
      azimuthDeg: 0,
      dragEnabled: false,
      levelLaunch: true,
      target: {
        x: 20 * Math.cos(Math.PI / 4) * 1.0,
        y: 0.05 + 20 * Math.sin(Math.PI / 4) * 1.0 - 0.5 * 9.81 * 1.0,
        z: 0,
        radius: 0.6,
      },
    });
    fireCannon(hunter);
    runSteps(() => stepCannon(hunter, CANNON_DT), 300);
    expect(hunter.status).toBe("hit");
    expect(hunter.hits).toBe(1);
    expect(getCannonTelemetry(hunter).impactEvent?.type).toBe("target");
  });
});

describe("Ramp Race kernel", () => {
  it("matches analytic pure-rolling sphere acceleration, finish time, no-slip, and energy conservation", () => {
    const slopeDeg = 20;
    const length = 3.0;
    const g = 9.81;
    const state = createRampRaceState({
      ramp: { slopeDeg, length, gravity: g },
      ballA: { mass: 1.0, radius: 0.1, mu: 0.5 },
      ballB: { mass: 3.0, radius: 0.06, mu: 0.5 },
    });
    startRampRace(state);

    let maxSlipA = 0;
    let maxDriftA = 0;
    for (let i = 0; i < 400; i += 1) {
      stepRampRace(state, RAMP_DT);
      const t = getRampRaceTelemetry(state);
      maxSlipA = Math.max(maxSlipA, t.ballA.slipDelta);
      maxDriftA = Math.max(maxDriftA, t.ballA.energyDriftRatio);
      if (state.status === "finished") break;
    }

    const theta = (slopeDeg * Math.PI) / 180;
    const aExpected = (5 / 7) * g * Math.sin(theta);
    const tExpected = Math.sqrt((2 * length) / aExpected);

    expect(state.status).toBe("finished");
    expect(state.winner).toBe("tie");
    expect(maxSlipA).toBeLessThanOrEqual(0.03);
    expect(maxDriftA).toBeLessThanOrEqual(0.03);
    expect(
      Math.abs((state.ballA.finishTime ?? 0) - tExpected) / tExpected,
    ).toBeLessThanOrEqual(0.03);
  });

  it("matches frictionless sliding acceleration and finishes faster than rolling", () => {
    const state = createRampRaceState({
      ramp: { slopeDeg: 20, length: 3.0, gravity: 9.81 },
      ballA: { mass: 1.0, radius: 0.1, mu: 0 }, // pure sliding
      ballB: { mass: 1.0, radius: 0.1, mu: 0.5 }, // pure rolling
    });
    startRampRace(state);
    runSteps(() => stepRampRace(state, RAMP_DT), 400);

    const tExpectedSlide = Math.sqrt(
      (2 * 3.0) / (9.81 * Math.sin((20 * Math.PI) / 180)),
    );
    expect(state.status).toBe("finished");
    expect(state.winner).toBe("A");
    expect(state.ballA.omega).toBe(0);
    expect(
      Math.abs((state.ballA.finishTime ?? 0) - tExpectedSlide) / tExpectedSlide,
    ).toBeLessThanOrEqual(0.03);
  });
});

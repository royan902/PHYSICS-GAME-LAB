import { expect, it } from "vitest";
import { BilliardSession } from "../../src/games/billiard/session";
import { POCKETS, RADIUS } from "../../src/games/billiard/physics";
// Independent geometric ghost-ball strategy. Proves layouts are solvable,
// not an oracle for the solver itself (analytic tests cover that separately).
it("all five layouts can be completed within their shot budget", () => {
  for (let level = 0; level < 5; level++) {
    let session = new BilliardSession("game", level);
    const solution: { angle: number; power: number }[] = [];
    while (session.status !== "won" && solution.length < 8) {
      let best: BilliardSession | undefined,
        bestShot: { angle: number; power: number } | undefined;
      const cue = session.world.balls[0];
      outer: for (const target of session.world.balls.filter(
        (b) => b.id > 0 && b.active,
      )) {
        for (const pocket of POCKETS) {
          const dx = pocket.x - target.x,
            dz = pocket.z - target.z,
            dist = Math.hypot(dx, dz);
          const ghost = {
            x: target.x - (dx / dist) * 2 * RADIUS,
            z: target.z - (dz / dist) * 2 * RADIUS,
          };
          const angle =
            ((Math.round(
              (Math.atan2(ghost.z - cue.z, ghost.x - cue.x) * 1800) / Math.PI,
            ) /
              10) *
              Math.PI) /
            180;
          for (const power of [18, 25, 32, 40, 50, 65]) {
            const candidate = new BilliardSession("game", level);
            Object.assign(candidate, structuredClone(session));
            candidate.setAngle(angle);
            candidate.setPower(power);
            candidate.queueShot();
            for (let i = 0; i < 8000 && candidate.status === "moving"; i++)
              candidate.tick();
            if (
              candidate.pocketCount > session.pocketCount &&
              candidate.penalties === session.penalties
            ) {
              best = candidate;
              bestShot = { angle: (angle * 180) / Math.PI, power };
              break outer;
            }
          }
        }
      }
      expect(
        best,
        `no geometric solution at level ${level + 1}, shot ${solution.length + 1}`,
      ).toBeDefined();
      solution.push(bestShot!);
      session = best!;
    }
    console.log(`Level ${level + 1} solution`, JSON.stringify(solution));
    expect(session.status).toBe("won");
  }
}, 30000);

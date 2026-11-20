import { expect, it } from "vitest";
import { BilliardSession } from "../../src/games/billiard/session";
it("Bank Shot shipped preset completes through a cushion route", () => {
  const s = new BilliardSession("game", 3);
  s.queueShot();
  for (let i = 0; i < 7000 && s.status === "moving"; i++) s.tick();
  expect(s.status).toBe("won");
  expect(s.world.cushionHits).toBeGreaterThan(0);
  expect(s.penalties).toBe(0);
});

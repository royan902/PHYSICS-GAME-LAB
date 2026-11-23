import { expect, it } from "vitest";
import { resolveShot, type ShotRecord } from "../../src/games/billiard/rules";
import { BilliardSession } from "../../src/games/billiard/session";
const legal: ShotRecord = {
  break: false,
  call: { ball: 1, pocket: 2 },
  destinations: { 1: 2, 8: 3, 9: 2 },
  first: 1,
  pocketed: [1],
  off: [],
  rails: [],
  railAfterContact: false,
  group: null,
  remaining: 7,
};
it("open table assigns called ball and pocket, including mixed pots; wrong first cannot assign", () => {
  expect(resolveShot({ ...legal, pocketed: [9, 1] })).toMatchObject({
    assigned: "solid",
    keepTurn: true,
    foul: "",
  });
  expect(resolveShot({ ...legal, first: 8 })).toMatchObject({
    assigned: null,
    keepTurn: false,
  });
});
it("break keeps table open, requires four different object rails or a pot, respots eight", () => {
  expect(resolveShot({ ...legal, break: true })).toMatchObject({
    assigned: null,
    keepTurn: true,
  });
  expect(
    resolveShot({ ...legal, break: true, pocketed: [8] }).respotEight,
  ).toBe(true);
  expect(resolveShot({ ...legal, break: true, first: 2 }).foul).toBe("");
  expect(
    resolveShot({ ...legal, break: true, pocketed: [], rails: [1, 1, 2, 3] })
      .foul,
  ).not.toBe("");
  expect(
    resolveShot({ ...legal, break: true, pocketed: [], rails: [1, 2, 3, 4] })
      .foul,
  ).toBe("");
});
it("own pot continues, opponent pot changes turn, rail required after contact on dry shot", () => {
  expect(resolveShot({ ...legal, illegalHeadContact: true }).foul).toContain(
    "head string",
  );
  expect(resolveShot({ ...legal, group: "solid" }).keepTurn).toBe(true);
  expect(
    resolveShot({ ...legal, group: "solid", pocketed: [9] }),
  ).toMatchObject({ keepTurn: false, foul: "" });
  expect(
    resolveShot({ ...legal, pocketed: [], railAfterContact: false }).foul,
  ).not.toBe("");
  expect(
    resolveShot({ ...legal, pocketed: [], railAfterContact: true }).foul,
  ).toBe("");
  expect(resolveShot({ ...legal, group: "solid", first: 9 }).foul).not.toBe("");
});
it("eight needs cleared group before shot; scratch with legal eight loses, including all events", () => {
  expect(
    resolveShot({
      ...legal,
      group: "solid",
      call: { ball: 8, pocket: 3 },
      remaining: 0,
      first: 8,
      pocketed: [8],
    }).result,
  ).toBe("win");
  for (const shot of [
    { remaining: 1, pocketed: [1, 8], first: 1 },
    { remaining: 0, pocketed: [8, 0], first: 8 },
    { remaining: 0, pocketed: [], off: [8], first: 8 },
  ])
    expect(resolveShot({ ...legal, group: "solid", ...shot }).result).toBe(
      "loss",
    );
});
it("session consumes rule result: assignment, retained turn, scratch, winner and respot", () => {
  const s = new BilliardSession();
  s.breaking = false;
  s.record = { ...legal };
  s.world.balls[1].active = false;
  s.finishShot();
  expect(s.groups).toEqual(["solid", "stripe"]);
  expect(s.player).toBe(0);
  s.record = { ...legal, group: "solid", pocketed: [0] };
  s.world.balls[0].active = false;
  s.finishShot();
  expect(s.player).toBe(1);
  expect(s.ballInHand).toBe(true);
  expect(s.world.balls[0].active).toBe(true);
  s.record = {
    ...legal,
    call: { ball: 8, pocket: 3 },
    group: "stripe",
    remaining: 0,
    first: 8,
    pocketed: [8],
  };
  s.finishShot();
  expect(s.winner).toBe(1);
  expect(s.status).toBe("won");
  const b = new BilliardSession();
  b.world.balls[8].active = false;
  b.record = { ...legal, break: true, pocketed: [8] };
  b.finishShot();
  expect(b.world.balls[8].active).toBe(true);
  expect(b.groups).toEqual([null, null]);
});

it("wrong pocket ends turn and wrong eight loses", () => {
  expect(resolveShot({ ...legal, call: { ball: 1, pocket: 5 } })).toMatchObject(
    { foul: "", keepTurn: false, assigned: null },
  );
  expect(
    resolveShot({
      ...legal,
      call: { ball: 8, pocket: 5 },
      group: "solid",
      remaining: 0,
      first: 8,
      pocketed: [8],
    }).result,
  ).toBe("loss");
});

it("illegal break lets incoming player return the break; scratch plus eight offers a new rack", () => {
  const s = new BilliardSession();
  s.record = { ...legal, break: true, pocketed: [], rails: [2] };
  s.finishShot();
  expect(s.player).toBe(1);
  s.chooseBreak("Rack ulang · lawan break");
  expect(s.player).toBe(0);
  expect(s.breaking).toBe(true);
  expect(s.world.balls.filter((b) => b.active)).toHaveLength(16);
  s.record = { ...legal, break: true, pocketed: [0, 8] };
  s.world.balls[0].active = s.world.balls[8].active = false;
  s.finishShot();
  expect(s.choices).toEqual(["Ball-in-hand · Head String", "Rack ulang"]);
  s.chooseBreak("Ball-in-hand · Head String");
  expect(s.placeBall(0, 0.1, 0)).toBe(false);
  expect(s.placeBall(0, -0.8, 0.2)).toBe(true);
  s.beginPlacement(0);
  expect(s.placing).toBe(0);
  expect(s.placeBall(0, -0.7, -0.2)).toBe(true);
});

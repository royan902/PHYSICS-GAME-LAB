import {
  applyShot,
  ball,
  createWorld,
  DEFAULT_CONFIG,
  DT,
  HALF_LENGTH,
  HALF_WIDTH,
  POCKETS,
  POCKET_RADIUS,
  RADIUS,
  speed,
  angularSpeed,
  stepWorld,
  type Config,
  type Shot,
  type World,
} from "./physics";
import { groupOf, resolveShot, type Group, type ShotRecord } from "./rules";
export type Mode = "classic" | "simulation";
export type Status = "ready" | "moving" | "won";
export function rack(mass: number) {
  const balls = [ball(0, -0.72, 0, mass)];
  const corners = [
    1 + Math.floor(Math.random() * 7),
    9 + Math.floor(Math.random() * 7),
  ];
  if (Math.random() < 0.5) corners.reverse();
  const order = Array.from({ length: 15 }, (_, i) => i + 1).filter(
    (id) => id !== 8 && !corners.includes(id),
  );
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.splice(4, 0, 8);
  order.splice(10, 0, corners[0]);
  order.push(corners[1]);
  let index = 0;
  for (let row = 0; row < 5; row++)
    for (let col = 0; col <= row; col++) {
      balls.push(
        ball(
          order[index++],
          HALF_LENGTH / 2 + row * (Math.sqrt(3) * RADIUS + 0.0003),
          (col - row / 2) * (2 * RADIUS + 0.0004),
          mass,
        ),
      );
    }
  return balls.sort((a, b) => a.id - b.id);
}
export class BilliardSession {
  world: World;
  status: Status = "ready";
  paused = false;
  strokes = 0;
  penalties = 0;
  angle = 0;
  power = 100;
  spin: Shot = { side: 0, top: 0, elevation: 0 };
  accumulator = 0;
  droppedFrames = 0;
  settledTicks = 0;
  pending: { angle: number; power: number; spin: Shot } | null = null;
  lastShot: ReturnType<typeof applyShot> = null;
  pocketCount = 0;
  player: 0 | 1 = 0;
  groups: [Group | null, Group | null] = [null, null];
  winner: number | null = null;
  breaking = true;
  ballInHand = false;
  canRepositionCue = false;
  placing: number | null = null;
  notice = "Pemain 1 · break. Bidik rack dan atur power.";
  record: ShotRecord | null = null;
  soundSerial = 0;
  onSound?: (kind: string, strength: number) => void;
  bindSound(fn: NonNullable<BilliardSession["onSound"]>) {
    this.onSound = fn;
    return () => {
      this.onSound = undefined;
    };
  }
  callBall = -1;
  callPocket = -1;
  headOnly = false;
  private crossedHeadString = false;
  lastPlacement: { id: number } | null = null;
  preview: { x: number; z: number } | null = null;
  choices: string[] = [];
  previewPlacement(x: number, z: number) {
    this.preview = { x, z };
  }
  setCall(ball: number, pocket: number) {
    if (this.canPlace) {
      this.callBall = ball;
      this.callPocket = pocket;
    }
  }
  get targets() {
    const g = this.groups[this.player];
    return this.world.balls.filter(
      (b) =>
        b.active &&
        b.id > 0 &&
        (g
          ? this.remaining(g) === 0
            ? b.id === 8
            : groupOf(b.id) === g
          : b.id !== 8 ||
            !this.remaining("solid") ||
            !this.remaining("stripe")),
    );
  }
  get callReady() {
    return (
      this.mode === "simulation" ||
      this.breaking ||
      this.callBall === 0 ||
      (this.targets.some((b) => b.id === this.callBall) &&
        Number.isInteger(this.callPocket) &&
        this.callPocket >= 0 &&
        this.callPocket < 6)
    );
  }
  chooseBreak(choice: string) {
    if (!this.choices.includes(choice)) return;
    this.choices = [];
    if (choice.includes("Rack ulang")) {
      if (choice.includes("lawan")) this.player = this.player === 0 ? 1 : 0;
      this.world = createWorld(rack(this.world.config.mass), this.world.config);
      this.breaking = true;
    }
    this.headOnly = choice.includes("Head String") || this.breaking;
    this.ballInHand = choice.includes("Head String");
    this.canRepositionCue = this.ballInHand;
    this.placing = this.ballInHand ? 0 : null;
    this.notice = "Pemain " + (this.player + 1) + " · " + choice;
  }
  constructor(
    public mode: Mode = "classic",
    config: Config = DEFAULT_CONFIG,
  ) {
    this.world = createWorld(rack(config.mass), config);
    if (mode === "simulation")
      this.notice = "Sandbox · bebas membidik atau atur posisi bola.";
  }
  get canShoot() {
    return (
      !this.paused &&
      this.status === "ready" &&
      !this.pending &&
      !this.choices.length &&
      !this.ballInHand &&
      this.placing === null &&
      this.world.balls.every(
        (b) => !b.active || (speed(b) === 0 && angularSpeed(b) === 0),
      )
    );
  }
  get canPlace() {
    return !this.paused && this.status === "ready" && !this.pending;
  }
  remaining(group: Group | null) {
    return this.world.balls.filter(
      (b) =>
        b.active && (group ? groupOf(b.id) === group : b.id > 0 && b.id !== 8),
    ).length;
  }
  setAngle(v: number) {
    if (this.canShoot && Number.isFinite(v))
      this.angle = Math.atan2(Math.sin(v), Math.cos(v));
  }
  setPower(v: number) {
    if (this.canShoot && Number.isFinite(v))
      this.power = Math.max(0, Math.min(100, v));
  }
  setSpin(side: number, top: number, elevation = this.spin.elevation) {
    if (!this.canShoot || ![side, top, elevation].every(Number.isFinite))
      return;
    const norm = Math.max(1, Math.hypot(side, top));
    this.spin = {
      side: side / norm,
      top: top / norm,
      elevation: Math.max(0, Math.min(70, elevation)),
    };
  }
  beginPlacement(id: number) {
    if (
      (this.mode === "simulation" ||
        (id === 0 && (this.breaking || this.canRepositionCue))) &&
      this.canPlace &&
      Number.isInteger(id) &&
      id >= 0 &&
      id <= 15
    )
      this.placing = id;
  }
  cancelPlacement() {
    if (!this.ballInHand) {
      this.placing = null;
      this.preview = null;
    }
  }
  validPosition(id: number, x: number, z: number) {
    return (
      [x, z].every(Number.isFinite) &&
      (!(
        id === 0 &&
        this.mode === "classic" &&
        (this.breaking || this.headOnly)
      ) ||
        x < -HALF_LENGTH / 2) &&
      Math.abs(x) <= HALF_LENGTH - RADIUS &&
      Math.abs(z) <= HALF_WIDTH - RADIUS &&
      POCKETS.every(
        (p) => Math.hypot(x - p.x, z - p.z) > POCKET_RADIUS + RADIUS,
      ) &&
      this.world.balls.every(
        (b) =>
          b.id === id ||
          !b.active ||
          Math.hypot(b.x - x, b.z - z) >= 2 * RADIUS + 0.0002,
      )
    );
  }
  placeBall(id: number, x: number, z: number) {
    if (
      !this.canPlace ||
      !Number.isInteger(id) ||
      !this.world.balls[id] ||
      !(
        this.mode === "simulation" ||
        (id === 0 &&
          (this.ballInHand || this.breaking || this.canRepositionCue))
      ) ||
      !this.validPosition(id, x, z)
    ) {
      this.notice = "Posisi ditolak: hindari bola lain, pocket, dan tepi meja.";
      return false;
    }
    Object.assign(this.world.balls[id], {
      x,
      z,
      y: RADIUS,
      vx: 0,
      vy: 0,
      vz: 0,
      wx: 0,
      wy: 0,
      wz: 0,
      active: true,
    });
    this.lastPlacement = { id };
    this.ballInHand = false;
    this.placing = null;
    this.preview = null;
    this.notice =
      this.mode === "classic"
        ? `Pemain ${this.player + 1} · posisi sah, siap membidik.`
        : `Bola ${id} ditempatkan.`;
    return true;
  }
  respot(id: number) {
    // Spot along the long string, toward the foot rail first (WPA 1.5).
    const spot = HALF_LENGTH / 2;
    const clearance = 2 * RADIUS + 0.0002;
    const alongString = this.world.balls
      .filter((b) => b.active && b.id !== id && Math.abs(b.z) < clearance)
      .flatMap((b) => {
        const dx = Math.sqrt(clearance ** 2 - b.z ** 2) + 1e-8;
        return [b.x - dx, b.x + dx];
      });
    const candidates = [
      ...(id === 8
        ? [
            spot,
            ...alongString.filter((x) => x >= spot).sort((a, b) => a - b),
            ...alongString.filter((x) => x < spot).sort((a, b) => b - a),
          ].map((x) => [x, 0])
        : []),
      [id === 8 ? HALF_LENGTH / 2 : -0.72, 0],
      ...Array.from({ length: 220 }, (_, i) => [
        -1.1 + (i % 20) * 0.112,
        -0.5 + Math.floor(i / 20) * 0.1,
      ]),
    ];
    const p = candidates.find(([x, z]) => this.validPosition(id, x, z));
    if (!p) throw new Error("Tidak ada posisi bola yang aman.");
    Object.assign(this.world.balls[id], {
      x: p[0],
      z: p[1],
      y: RADIUS,
      vx: 0,
      vy: 0,
      vz: 0,
      wx: 0,
      wy: 0,
      wz: 0,
      active: true,
    });
  }
  queueShot() {
    if (
      !this.canShoot ||
      !this.callReady ||
      !Number.isFinite(this.power) ||
      this.power <= 0 ||
      this.power > 100 ||
      !Number.isFinite(this.angle)
    )
      return false;
    this.canRepositionCue = false;
    this.crossedHeadString = false;
    this.record = {
      call:
        this.callBall > 0
          ? { ball: this.callBall, pocket: this.callPocket }
          : null,
      destinations: {},
      break: this.breaking,
      first: null,
      pocketed: [],
      off: [],
      rails: [],
      railAfterContact: false,
      group: this.groups[this.player],
      remaining: this.remaining(this.groups[this.player]),
    };
    if (!this.groups[this.player] && this.callBall === 8) {
      this.record.group = this.remaining("solid") === 0 ? "solid" : "stripe";
      this.record.remaining = 0;
    }
    this.pending = {
      angle: this.angle,
      power: this.power,
      spin: { ...this.spin },
    };
    this.status = "moving";
    return true;
  }
  setPaused(value: boolean) {
    this.paused = value;
    this.accumulator = 0;
  }
  singleStep() {
    if (this.paused) {
      this.paused = false;
      this.tick();
      this.setPaused(true);
    }
  }
  advance(delta: number) {
    if (this.paused || !Number.isFinite(delta) || delta < 0) {
      this.accumulator = 0;
      return;
    }
    this.accumulator += Math.min(delta, 0.1);
    let steps = 0;
    while (this.accumulator + 1e-12 >= DT && steps < 8) {
      this.tick();
      this.accumulator = Math.max(0, this.accumulator - DT);
      steps++;
    }
    if (this.accumulator >= DT) {
      this.accumulator %= DT;
      this.droppedFrames++;
    }
  }
  tick() {
    if (this.paused) return;
    if (this.pending) {
      this.lastShot = applyShot(
        this.world.balls[0],
        this.pending.angle,
        this.pending.power,
        this.pending.spin,
      );
      this.pending = null;
      if (!this.lastShot) {
        this.status = "ready";
        return;
      }
      this.onSound?.("cue", this.power / 12.5);
      if (this.lastShot.vertical > 0)
        this.onSound?.("jump", this.lastShot.vertical);
      this.strokes++;
      this.settledTicks = 0;
      this.notice = "Pukulan · tunggu semua bola berhenti.";
      this.soundSerial++;
    }
    if (this.status !== "moving") return;
    stepWorld(this.world);
    if (this.world.tick % 16 === 0)
      this.onSound?.(
        "roll",
        Math.max(...this.world.balls.filter((b) => b.active).map(speed), 0),
      );
    const r = this.record!;
    for (const e of this.world.events) {
      this.onSound?.(e.kind, e.strength);
      if (e.kind === "contact") {
        if (r.first === null && (e.a === 0 || e.b === 0)) {
          r.first = e.a === 0 ? e.b : e.a;
          const objectX = e.a === 0 ? e.bx : e.ax;
          const cueX = e.a === 0 ? e.ax : e.bx;
          r.illegalHeadContact =
            this.headOnly &&
            !r.break &&
            !this.crossedHeadString &&
            objectX < -HALF_LENGTH / 2 &&
            cueX < -HALF_LENGTH / 2;
        }
        this.soundSerial++;
      } else if (e.kind === "rail") {
        r.rails.push(e.id);
        if (r.first !== null) r.railAfterContact = true;
        this.soundSerial++;
      } else if (e.kind === "pocket") {
        r.destinations[e.id] = e.pocket;
        r.pocketed.push(e.id);
        if (e.id > 0) this.pocketCount++;
        this.notice = `Bola ${e.id === 0 ? "putih" : e.id} masuk pocket.`;
        this.soundSerial++;
      } else if (e.kind === "off") r.off.push(e.id);
    }
    if (this.world.balls[0].x >= -HALF_LENGTH / 2)
      this.crossedHeadString = true;
    const stopped = this.world.balls.every(
      (b) =>
        !b.active ||
        (speed(b) < 0.01 &&
          angularSpeed(b) * RADIUS < 0.01 &&
          b.y <= RADIUS + 1e-6),
    );
    this.settledTicks = stopped ? this.settledTicks + 1 : 0;
    if (this.settledTicks >= 30) {
      for (const b of this.world.balls)
        b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0;
      this.finishShot();
    }
  }
  finishShot() {
    const r = this.record!;
    this.status = "ready";
    if (this.mode === "simulation") {
      for (const id of r.off.filter((id) => id !== 0)) this.respot(id);
      if (!this.world.balls[0].active) this.respot(0);
      this.notice = "Meja diam · lanjutkan eksperimen atau atur posisi bola.";
      return;
    }
    const result = resolveShot(r);
    if (result.respotEight) this.respot(8);
    this.callBall = this.callPocket = -1;
    this.headOnly = false;
    if (r.break && (result.foul || result.respotEight)) {
      if (result.foul) {
        this.player = this.player === 0 ? 1 : 0;
        this.penalties++;
      }
      this.breaking = false;
      const scratched = !this.world.balls[0].active;
      if (scratched) this.respot(0);
      this.choices =
        result.respotEight && r.pocketed.includes(8)
          ? [
              result.foul ? "Ball-in-hand · Head String" : "Terima posisi",
              "Rack ulang",
            ]
          : !scratched &&
              !r.off.length &&
              !r.pocketed.length &&
              new Set(r.rails.filter((id) => id > 0)).size < 4
            ? ["Terima posisi", "Rack ulang", "Rack ulang · lawan break"]
            : scratched
              ? ["Ball-in-hand · Head String"]
              : ["Terima posisi", "Ball-in-hand · Head String"];
      this.notice =
        (result.foul ? "Foul · " + result.foul : "Bola 8 masuk saat break") +
        " · Pemain " +
        (this.player + 1) +
        " memilih.";
      this.onSound?.(result.foul ? "foul" : "turn", 1);
      return;
    }
    if (result.result) {
      this.onSound?.("win", 1);
      this.winner = result.result === "win" ? this.player : 1 - this.player;
      this.status = "won";
      this.notice = `Pemain ${this.winner + 1} menang! ${result.foul}`;
      return;
    }
    if (result.assigned) {
      this.groups[this.player] = result.assigned;
      this.groups[1 - this.player] =
        result.assigned === "solid" ? "stripe" : "solid";
    }
    this.onSound?.(result.foul ? "foul" : "turn", 1);
    if (!result.keepTurn) this.player = this.player === 0 ? 1 : 0;
    this.breaking = false;
    if (!this.world.balls[0].active) this.respot(0);
    this.ballInHand = !!result.foul;
    this.canRepositionCue = this.ballInHand;
    this.placing = this.ballInHand ? 0 : null;
    if (result.foul) this.penalties++;
    this.notice = result.foul
      ? `Foul: ${result.foul}. Pemain ${this.player + 1} · ball-in-hand, pilih posisi bola putih.`
      : `Pemain ${this.player + 1} · ${result.keepTurn ? "bola legal masuk, lanjutkan" : "giliran berikutnya"}.`;
  }
}

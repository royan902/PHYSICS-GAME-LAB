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
  stepWorld,
  totals,
  type World,
} from "./physics";
import { LEVELS } from "./levels";
import { experimentPositions, type Experiment } from "./experiments";
export type Mode = "game" | "simulation";
export type Status = "ready" | "moving" | "won" | "lost";
export class BilliardSession {
  world: World;
  mode: Mode;
  level: number;
  experiment: Experiment;
  status: Status = "ready";
  paused = false;
  strokes = 0;
  penalties = 0;
  angle = -Math.PI / 2;
  power = 25;
  initialSpeed = 1.25;
  accumulator = 0;
  droppedFrames = 0;
  settledTicks = 0;
  pending: { angle: number; power: number } | null = null;
  lastShot: ReturnType<typeof applyShot> = null;
  pocketCount = 0;
  notice = "Bidik dan pukul saat semua bola diam.";
  samples: { time: number; energy: number; speed: number }[] = [];
  constructor(
    mode: Mode = "game",
    level = 0,
    config = DEFAULT_CONFIG,
    experiment: Experiment = "Momentum",
  ) {
    this.mode = mode;
    this.level = Math.max(0, Math.min(LEVELS.length - 1, level));
    this.experiment = experiment;
    const preset = LEVELS[this.level];
    this.angle = mode === "game" ? (preset.angle * Math.PI) / 180 : 0;
    this.power = mode === "game" ? preset.power : 25;
    const positions =
      mode === "game"
        ? [preset.cue, ...preset.targets]
        : experimentPositions(experiment);
    this.world = createWorld(
      positions.map(([x, z], id) => ball(id, x, z, config.mass)),
      config,
    );
  }
  get canShoot() {
    return (
      !this.paused &&
      this.status === "ready" &&
      !this.pending &&
      this.world.balls.every((b) => !b.active || speed(b) === 0)
    );
  }
  setAngle(value: number) {
    if (this.canShoot && Number.isFinite(value))
      this.angle = Math.atan2(Math.sin(value), Math.cos(value));
  }
  setPower(value: number) {
    if (this.canShoot && Number.isFinite(value))
      this.power = Math.max(0, Math.min(100, value));
  }
  setInitialSpeed(value: number) {
    if (this.canShoot && Number.isFinite(value))
      this.initialSpeed = Math.max(0, Math.min(5, value));
  }
  singleStep() {
    if (this.paused) {
      this.paused = false;
      this.tick();
      this.setPaused(true);
    }
  }
  queueShot() {
    const power =
      this.mode === "simulation" ? this.initialSpeed / 0.05 : this.power;
    if (
      !this.canShoot ||
      power <= 0 ||
      power > 100 ||
      !Number.isFinite(power) ||
      !Number.isFinite(this.angle)
    )
      return false;
    this.pending = { angle: this.angle, power };
    this.status = "moving";
    return true;
  }
  setPaused(value: boolean) {
    this.paused = value;
    this.accumulator = 0;
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
      const cue = this.world.balls[0];
      this.lastShot = applyShot(cue, this.pending.angle, this.pending.power);
      this.pending = null;
      if (this.lastShot) {
        this.strokes++;
        this.settledTicks = 0;
        this.notice = "Bola bergerak · tunggu hingga diam.";
      }
    }
    if (this.status !== "moving") return;
    stepWorld(this.world);
    for (const id of this.world.pockets) {
      if (id === 0) {
        this.penalties++;
        this.notice =
          "Scratch · penalti +1, bola putih kembali setelah meja diam.";
      } else {
        this.pocketCount++;
        this.notice = `Bola ${id} masuk pocket!`;
      }
    }
    if (this.world.tick % 12 === 0) {
      this.samples.push({
        time: this.world.tick * DT,
        energy: totals(this.world).energy,
        speed: speed(this.world.balls[0]),
      });
      if (this.samples.length > 120) this.samples.shift();
    }
    const stopped = this.world.balls.every((b) => !b.active || speed(b) < 0.01);
    this.settledTicks = stopped ? this.settledTicks + 1 : 0;
    if (this.settledTicks >= 30) {
      for (const b of this.world.balls) {
        b.vx = 0;
        b.vz = 0;
      }
      if (!this.world.balls[0].active) this.respawn();
      const remaining = this.world.balls.filter(
        (b) => b.id > 0 && b.active,
      ).length;
      this.status =
        this.mode === "game" && remaining === 0
          ? "won"
          : this.mode === "game" &&
              this.strokes + this.penalties >= LEVELS[this.level].limit
            ? "lost"
            : "ready";
      if (this.status === "won")
        this.notice = "Level selesai! Semua target masuk.";
      else if (this.status === "lost")
        this.notice =
          "Batas pukulan habis. Coba lagi dengan power lebih kecil.";
      else if (this.penalties === 0 && this.pocketCount === 0)
        this.notice = "Meja diam · siap untuk pukulan berikutnya.";
    }
  }
  respawn() {
    const cue = this.world.balls[0];
    const candidates = [
      [-0.7, 0],
      ...Array.from({ length: 90 }, (_, i) => [
        -1.05 + (i % 10) * 0.21,
        -0.45 + Math.floor(i / 10) * 0.1,
      ]),
    ];
    const p = candidates.find(
      ([x, z]) =>
        Math.abs(x) < HALF_LENGTH - RADIUS &&
        Math.abs(z) < HALF_WIDTH - RADIUS &&
        POCKETS.every(
          (p) => Math.hypot(p.x - x, p.z - z) > POCKET_RADIUS + RADIUS,
        ) &&
        this.world.balls.every(
          (b) =>
            b.id === 0 ||
            !b.active ||
            Math.hypot(b.x - x, b.z - z) > 2 * RADIUS + 0.005,
        ),
    );
    if (!p) throw new Error("Tidak ada posisi respawn aman.");
    cue.x = p[0];
    cue.z = p[1];
    cue.vx = 0;
    cue.vz = 0;
    cue.active = true;
  }
}

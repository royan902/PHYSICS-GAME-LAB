// Original synthesized sounds. All nodes belong to this game instance.
export class PoolAudio {
  ctx: AudioContext | null = null;
  volume = 0.45;
  music = 0.22;
  muted = false;
  private master: GainNode | null = null;
  private timer = 0;
  private beat = 0;
  private next = 0;
  private last = new Map<string, number>();
  start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume().catch(() => {});
    this.sync();
    if (!this.timer) {
      this.next = this.ctx.currentTime;
      this.timer = window.setInterval(() => this.score(), 180);
    }
  }
  setPreferences(volume: number, music: number, sound: boolean) {
    this.volume = volume;
    this.music = music;
    this.muted = !sound;
    this.sync();
  }
  sync() {
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 1,
        this.ctx.currentTime,
        0.02,
      );
  }
  private tone(
    freq: number,
    time: number,
    duration: number,
    level: number,
    type: OscillatorType,
    end = freq,
  ) {
    const c = this.ctx;
    if (!c || !this.master || level <= 0) return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    o.frequency.exponentialRampToValueAtTime(end, time + duration);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), time + 0.009);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(time);
    o.stop(time + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private score() {
    const c = this.ctx;
    if (!c || c.state !== "running") return;
    if (this.next < c.currentTime) this.next = c.currentTime;
    while (this.next < c.currentTime + 0.25) {
      const chords = [
        [146.83, 174.61, 220, 261.63],
        [130.81, 164.81, 196, 246.94],
        [110, 130.81, 164.81, 196],
        [98, 123.47, 146.83, 174.61],
      ];
      const chord = chords[Math.floor(this.beat / 8) % 4];
      this.tone(
        chord[[0, 2, 1, 3, 0, 1, 3, 2][this.beat % 8]] * 2,
        this.next,
        0.75,
        this.music * 0.085,
        "sine",
      );
      if (this.beat % 4 === 0)
        this.tone(chord[0] / 2, this.next, 1.2, this.music * 0.11, "triangle");
      this.beat++;
      this.next += 0.36;
    }
  }
  play(kind: string, strength = 1) {
    const c = this.ctx;
    if (!c || c.state !== "running" || this.muted) return;
    const t = c.currentTime;
    if (t - (this.last.get(kind) ?? -1) < (kind === "roll" ? 0.12 : 0.026))
      return;
    this.last.set(kind, t);
    const freq: Record<string, number> = {
      cue: 900,
      contact: 1300,
      rail: 310,
      pocket: 195,
      off: 88,
      land: 230,
      roll: 64,
      click: 600,
      foul: 220,
      turn: 520,
      win: 660,
      jump: 400,
    };
    const f = freq[kind] ?? 350;
    this.tone(
      f,
      t,
      kind === "roll" ? 0.16 : kind === "pocket" ? 0.23 : 0.085,
      Math.min(1, 0.17 + strength / 5) *
        this.volume *
        (kind === "roll" ? 0.03 : 0.25),
      "triangle",
      f * 0.45,
    );
    if (kind === "win" || kind === "turn")
      this.tone(f * 1.5, t + 0.09, 0.25, this.volume * 0.15, "sine");
  }
  dispose() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}

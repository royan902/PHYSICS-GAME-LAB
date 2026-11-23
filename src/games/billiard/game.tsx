"use client";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PoolAudio } from "./audio";
import BilliardScene from "./scene";
import { BilliardSession, type Mode } from "./session";
import {
  DEFAULT_CONFIG,
  DT,
  RADIUS,
  angularSpeed,
  shotMetrics,
  speed,
  totals,
  type Config,
} from "./physics";

import { keyboardInput } from "./input";
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="billiard-range">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0)}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Menu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="pool-dialog"
      onCancel={(e) => e.preventDefault()}
    >
      {children}
    </dialog>
  );
}
export default function BilliardGame() {
  const router = useRouter();
  const [session, setSession] = useState(() => new BilliardSession());
  const [selected, setSelected] = useState(false);
  const [, setRevision] = useState(0);
  const [top, setTop] = useState(false);
  const [panel, setPanel] = useState(false);
  const [setupBall, setSetupBall] = useState(0);
  const [prefs, setPrefs] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("pool-audio") ?? "{}");
      return {
        sound: p.sound !== false,
        music: Number.isFinite(p.music)
          ? Math.min(1, Math.max(0, p.music))
          : 0.22,
        volume: Number.isFinite(p.volume)
          ? Math.min(1, Math.max(0, p.volume))
          : 0.45,
      };
    } catch {
      return { sound: true, music: 0.22, volume: 0.45 };
    }
  });
  const sound = prefs.sound;
  const [assist, setAssist] = useState(true),
    [low, setLow] = useState(false),
    [zoom, setZoom] = useState(1),
    [pitch, setPitch] = useState(1);
  const [mixer] = useState(() => new PoolAudio());
  const [draft, setDraft] = useState<Config>({ ...DEFAULT_CONFIG });
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState<
    "restart" | "choose" | "parameters" | "close" | null
  >(null);
  const [position, setPosition] = useState({ x: -0.72, z: 0 });
  const update = () => setRevision((n) => n + 1);
  const fail = useCallback(() => {
    session.setPaused(true);
    setFailed(true);
  }, [session]);
  const [supported] = useState(() => {
    const canvas = document.createElement("canvas"),
      context = canvas.getContext("webgl2");
    const ok = !!context;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  });
  useEffect(() => {
    const timer = window.setInterval(() => setRevision((n) => n + 1), 100);
    const pause = () => {
      if (selected) {
        session.setPaused(true);
        setRevision((n) => n + 1);
      }
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
      session.setPaused(true);
    };
  }, [session, selected]);
  useEffect(() => {
    mixer.setPreferences(prefs.volume, prefs.music, prefs.sound);
    try {
      localStorage.setItem("pool-audio", JSON.stringify(prefs));
    } catch {}
  }, [mixer, prefs]);
  useEffect(() => () => mixer.dispose(), [mixer]);
  useEffect(
    () => session.bindSound((kind, strength) => mixer.play(kind, strength)),
    [session, mixer],
  );
  function reset(
    mode: Mode = session.mode,
    config: Config = session.world.config,
  ) {
    session.setPaused(true);
    setSession(new BilliardSession(mode, config));
    setTop(false);
    setPanel(false);
  }
  function shoot() {
    mixer.start();
    session.queueShot();
    update();
  }
  function request(action: NonNullable<typeof confirm>) {
    session.setPaused(true);
    setConfirm(action);
    update();
  }
  function proceed() {
    if (confirm === "close") {
      router.push("/games");
      return;
    }
    if (confirm === "choose") {
      reset();
      setSelected(false);
    } else
      reset(
        session.mode,
        confirm === "parameters" ? draft : session.world.config,
      );
    setConfirm(null);
  }
  const simulation = session.mode === "simulation",
    stats = totals(session.world);
  const predicted = shotMetrics(
    session.power,
    session.world.config.mass,
    session.spin,
  );
  const cue = session.world.balls[0],
    actual = session.lastShot;
  function place() {
    if (session.placing !== null) {
      session.placeBall(session.placing, position.x, position.z);
      update();
    }
  }
  return (
    <section
      onClickCapture={(e) => {
        if ((e.target as Element).closest("button")) {
          mixer.start();
          mixer.play("click");
        }
      }}
      className="billiard-app"
      aria-label="Billiard 3D"
    >
      {!selected ? (
        <div className="pool-select">
          <Link href="/games" className="pool-back">
            ← Kembali ke katalog
          </Link>
          <span className="pool-eyebrow">PHYSICS GAME LAB / 01</span>
          <div className="pool-eight">8</div>
          <h1>
            Billiard <em>Club.</em>
          </h1>
          <p>Meja yang sama. Dua cara bermain.</p>
          <div className="pool-mode-cards">
            <button
              onClick={() => {
                reset("classic", DEFAULT_CONFIG);
                setDraft({ ...DEFAULT_CONFIG });
                setSelected(true);
              }}
            >
              <span>01 / LOCAL MULTIPLAYER</span>
              <strong>Classic Mode ↗</strong>
              <small>8-ball · 2 pemain · satu perangkat</small>
            </button>
            <button
              onClick={() => {
                reset("simulation", DEFAULT_CONFIG);
                setDraft({ ...DEFAULT_CONFIG });
                setSelected(true);
              }}
            >
              <span>02 / PHYSICS SANDBOX</span>
              <strong>Simulation Mode ↗</strong>
              <small>Single player · spin, jump & eksperimen</small>
            </button>
          </div>
          <small>
            Mouse, touch, dan keyboard · landscape disarankan pada HP
          </small>
        </div>
      ) : (
        <>
          <div
            className="billiard-viewport"
            tabIndex={0}
            role="region"
            aria-label="Meja biliar. Panah untuk bidikan, Spasi untuk Shoot, P untuk pause."
            data-tick={session.world.tick}
            data-state={session.status}
            data-paused={session.paused}
            data-player={session.player + 1}
            data-shots={session.strokes}
            data-targets={session.remaining(null)}
            data-cue-x={cue.x}
            data-cue-z={cue.z}
            data-cue-y={cue.y}
            data-event-limit-hits={session.world.eventLimitHits}
            onKeyDown={(e) => {
              keyboardInput(session, e);
              update();
            }}
          >
            {failed || !supported ? (
              <div className="billiard-fallback" role="alert">
                <h2>Meja 3D belum dapat ditampilkan</h2>
                <p>
                  WebGL 2 tidak tersedia atau konteks grafis terputus. Aktifkan
                  akselerasi grafis.
                </p>
                <button onClick={() => window.location.reload()}>
                  Muat ulang game
                </button>
                <Link href="/games">Kembali ke katalog</Link>
              </div>
            ) : (
              <SceneBoundary onError={fail}>
                <BilliardScene
                  key={
                    selected
                      ? String(session.mode) +
                        session.world.config.mass +
                        session.world.config.friction +
                        session.world.config.restitution +
                        session.world.config.cushion
                      : "menu"
                  }
                  session={session}
                  top={top}
                  assist={assist}
                  zoom={zoom}
                  pitch={pitch}
                  low={low}
                  onFailure={fail}
                />
              </SceneBoundary>
            )}
          </div>
          <header className="pool-hud">
            <div className="pool-players">
              {simulation ? (
                <div className="pool-player active">
                  <strong>Simulation</strong>
                  <small>
                    Sandbox · {(session.world.tick * DT).toFixed(1)} s
                  </small>
                </div>
              ) : (
                [0, 1].map((p) => (
                  <div
                    key={p}
                    className={`pool-player ${session.player === p ? "active" : ""}`}
                  >
                    <strong>
                      Pemain {p + 1} {session.player === p ? "●" : ""}
                    </strong>
                    <small>
                      {session.groups[p] === "solid"
                        ? "Solid 1–7"
                        : session.groups[p] === "stripe"
                          ? "Stripe 9–15"
                          : "Meja terbuka"}{" "}
                      · {session.remaining(session.groups[p])} tersisa
                    </small>
                  </div>
                ))
              )}
            </div>
            <div
              className="pool-status"
              role="status"
              data-testid="game-notice"
            >
              {session.notice}
            </div>
            <nav aria-label="Pengaturan game">
              <button onClick={() => setTop(!top)} aria-pressed={top}>
                {top ? "Free Camera" : "Aim Camera"}
              </button>
              <button
                aria-label="Suara"
                aria-pressed={sound}
                onClick={() => setPrefs({ ...prefs, sound: !sound })}
              >
                {sound ? "♪ On" : "♪ Off"}
              </button>
              <button
                onClick={() => {
                  session.setPaused(true);
                  update();
                }}
              >
                Pause / Settings
              </button>
            </nav>
          </header>
          <aside className="pool-power" aria-label="Shot power">
            <span>POWER</span>
            <strong data-testid="power">{session.power.toFixed(0)}%</strong>
            <input
              className="pool-power-slider"
              style={{ "--shot-power": `${session.power}%` } as CSSProperties}
              aria-label="Power"
              type="range"
              min="0"
              max="100"
              value={session.power}
              disabled={!session.canShoot}
              onChange={(e) => {
                session.setPower(Number(e.target.value));
                update();
              }}
            />
            <small>Predicted velocity</small>
            <b data-testid="predicted-velocity">
              {predicted.velocity.toFixed(2)} m/s
            </b>
            <small>Estimated impulse</small>
            <b data-testid="predicted-impulse">
              {predicted.impulse.toFixed(3)} N·s
            </b>
            <button
              className="billiard-shoot"
              onClick={shoot}
              disabled={
                !session.canShoot ||
                !session.callReady ||
                session.power <= 0 ||
                failed ||
                !supported
              }
            >
              Shoot ↗
            </button>
          </aside>
          {!simulation &&
            session.canPlace &&
            !session.choices.length &&
            session.placing === null && (
              <div className="pool-call">
                {session.breaking ? (
                  <button
                    onClick={() => {
                      session.beginPlacement(0);
                      update();
                    }}
                  >
                    Posisi break
                  </button>
                ) : (
                  <>
                    {session.canRepositionCue && (
                      <button
                        onClick={() => {
                          session.beginPlacement(0);
                          update();
                        }}
                      >
                        Pindah bola putih
                      </button>
                    )}
                    <label>
                      Bola
                      <select
                        value={session.callBall}
                        onChange={(e) => {
                          session.setCall(+e.target.value, session.callPocket);
                          update();
                        }}
                      >
                        <option value={-1}>Pilih bola</option>
                        <option value={0}>Safety</option>
                        {session.targets.map((b) => (
                          <option key={b.id} value={b.id}>
                            #{b.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Pocket
                      <select
                        disabled={session.callBall === 0}
                        value={session.callPocket}
                        onChange={(e) => {
                          session.setCall(session.callBall, +e.target.value);
                          update();
                        }}
                      >
                        <option value={-1}>Pilih pocket</option>
                        {["A", "B", "C", "D", "E", "F"].map((n, i) => (
                          <option key={n} value={i}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>
            )}
          {session.choices.length > 0 && !session.paused && (
            <Menu>
              <h2>Pilihan setelah break</h2>
              <p>{session.notice}</p>
              {session.choices.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    session.chooseBreak(c);
                    update();
                  }}
                >
                  {c}
                </button>
              ))}
            </Menu>
          )}
          <div className="pool-bottom">
            <div className="pool-contact">
              <span>CONTACT / SPIN</span>
              <div
                className="pool-spin"
                role="slider"
                tabIndex={0}
                aria-label="Titik pukul"
                aria-valuemin={-100}
                aria-valuemax={100}
                aria-valuenow={Math.round(session.spin.top * 100)}
                aria-valuetext={`Side ${session.spin.side.toFixed(2)}, top ${session.spin.top.toFixed(2)}`}
                aria-disabled={!session.canShoot}
                onPointerDown={(e) => {
                  if (!session.canShoot) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const r = e.currentTarget.getBoundingClientRect();
                  session.setSpin(
                    (e.clientX - r.left - r.width / 2) / (r.width / 2),
                    -(e.clientY - r.top - r.height / 2) / (r.height / 2),
                  );
                  update();
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  session.setSpin(
                    (e.clientX - r.left - r.width / 2) / (r.width / 2),
                    -(e.clientY - r.top - r.height / 2) / (r.height / 2),
                  );
                  update();
                }}
                onPointerUp={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  if (e.key.startsWith("Arrow")) {
                    e.preventDefault();
                    session.setSpin(
                      session.spin.side +
                        (e.key === "ArrowRight"
                          ? 0.1
                          : e.key === "ArrowLeft"
                            ? -0.1
                            : 0),
                      session.spin.top +
                        (e.key === "ArrowUp"
                          ? 0.1
                          : e.key === "ArrowDown"
                            ? -0.1
                            : 0),
                    );
                    update();
                  }
                }}
              >
                <i
                  style={{
                    left: `${50 + session.spin.side * 40}%`,
                    top: `${50 - session.spin.top * 40}%`,
                  }}
                />
              </div>
              <button
                disabled={!session.canShoot}
                onClick={() => {
                  session.setSpin(0, 0);
                  update();
                }}
              >
                Center hit
              </button>
            </div>
            <div className="pool-aim-controls">
              <Range
                label="Elevasi"
                value={session.spin.elevation}
                min={0}
                max={70}
                unit="°"
                disabled={!session.canShoot}
                onChange={(v) => {
                  session.setSpin(session.spin.side, session.spin.top, v);
                  update();
                }}
              />
              <small>
                Prediksi tinggi: {(predicted.height * 100).toFixed(1)} cm
              </small>
              <Range
                label="Sudut bidikan"
                value={(session.angle * 180) / Math.PI}
                min={-180}
                max={180}
                step={0.1}
                unit="°"
                disabled={!session.canShoot}
                onChange={(v) => {
                  session.setAngle((v * Math.PI) / 180);
                  update();
                }}
              />
            </div>
            <div className="pool-hint">
              <strong>
                {simulation ? "PHYSICS SANDBOX" : "8-BALL / LOCAL DUO"}
              </strong>
              <small>
                {top
                  ? "Drag: orbit · dua jari: pan/zoom · kanan-drag: pan"
                  : "Drag: bidik · ← →: presisi · Spasi: pukul"}
              </small>
              {assist && session.canShoot && (
                <small>Perkiraan lintasan · hingga 0,75 s</small>
              )}
              {actual && (
                <small data-testid="actual-shot">
                  Aktual v₀ {actual.velocity.toFixed(2)} m/s · J{" "}
                  {actual.impulse.toFixed(3)} N·s
                </small>
              )}
              <button onClick={() => setPanel(!panel)} aria-expanded={panel}>
                {simulation ? "Data & setup" : "Aturan meja"}
              </button>
            </div>
          </div>
          {session.placing !== null && (
            <div className="pool-placement">
              <strong>
                {session.ballInHand ? "Ball-in-hand" : "Setup bola"} · Bola{" "}
                {session.placing}
              </strong>
              <small>
                {!simulation && (session.breaking || session.headOnly)
                  ? "Tempatkan di belakang head string (X < −0,635 m)."
                  : "Geser di meja lalu lepas, atau isi koordinat dalam meter."}
              </small>
              <label>
                X (m)
                <input
                  aria-label="Posisi X"
                  type="number"
                  min={-1.24}
                  max={1.24}
                  step="0.01"
                  value={position.x}
                  onChange={(e) => {
                    const x = Number(e.target.value);
                    setPosition({ ...position, x });
                    session.previewPlacement(x, position.z);
                  }}
                />
              </label>
              <label>
                Z (m)
                <input
                  aria-label="Posisi Z"
                  type="number"
                  min={-0.6}
                  max={0.6}
                  step="0.01"
                  value={position.z}
                  onChange={(e) => {
                    const z = Number(e.target.value);
                    setPosition({ ...position, z });
                    session.previewPlacement(position.x, z);
                  }}
                />
              </label>
              <button onClick={place}>Tempatkan bola</button>
              {!session.ballInHand && (
                <button
                  onClick={() => {
                    session.cancelPlacement();
                    update();
                  }}
                >
                  Selesai setup
                </button>
              )}
            </div>
          )}
          {panel && (
            <aside
              className="pool-panel"
              aria-label={simulation ? "Data simulasi" : "Aturan meja"}
            >
              <button
                className="pool-panel-close"
                onClick={() => setPanel(false)}
              >
                Tutup ×
              </button>
              <h2>{simulation ? "Physics Lab" : "Aturan meja"}</h2>
              {simulation && (
                <>
                  <label>
                    Bola untuk setup
                    <select
                      aria-label="Bola untuk setup"
                      disabled={!session.canPlace}
                      value={setupBall}
                      onChange={(e) => setSetupBall(Number(e.target.value))}
                    >
                      {session.world.balls.map((b) => (
                        <option key={b.id} value={b.id}>
                          Bola {b.id}
                          {!b.active ? " · pocket" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={!session.canPlace}
                    onClick={() => {
                      session.beginPlacement(setupBall);
                      update();
                      setPanel(false);
                    }}
                  >
                    Atur posisi bola
                  </button>
                  <Range
                    label="Massa bola"
                    value={draft.mass}
                    min={0.1}
                    max={0.3}
                    step={0.01}
                    unit=" kg"
                    onChange={(v) => setDraft({ ...draft, mass: v })}
                  />
                  <Range
                    label="Koefisien gesek"
                    value={draft.friction}
                    min={0}
                    max={0.08}
                    step={0.005}
                    onChange={(v) => setDraft({ ...draft, friction: v })}
                  />
                  <Range
                    label="Restitusi bola"
                    value={draft.restitution}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        restitution: v,
                        cushion: Math.min(v, draft.cushion),
                      })
                    }
                  />
                  <Range
                    label="Restitusi bantalan"
                    value={draft.cushion}
                    min={0}
                    max={draft.restitution}
                    step={0.05}
                    onChange={(v) => setDraft({ ...draft, cushion: v })}
                  />
                  <button onClick={() => request("parameters")}>
                    Terapkan & reset
                  </button>
                  <p>
                    Aktif: m {session.world.config.mass} kg · μ{" "}
                    {session.world.config.friction} · e{" "}
                    {session.world.config.restitution} · e bantalan{" "}
                    {session.world.config.cushion}
                  </p>
                  <p>
                    Momentum (X,Y,Z): {stats.px.toFixed(3)},{" "}
                    {stats.py.toFixed(3)}, {stats.pz.toFixed(3)} kg·m/s
                  </p>
                  <p>
                    Energi kinetik total (translasi + rotasi):{" "}
                    {stats.energy.toFixed(4)} J
                  </p>
                  <p>
                    Cue: {speed(cue).toFixed(3)} m/s · ω{" "}
                    {angularSpeed(cue).toFixed(2)} rad/s · h{" "}
                    {Math.max(0, cue.y - RADIUS).toFixed(3)} m
                  </p>
                  <div className="pool-ball-data">
                    {session.world.balls.map((b) => (
                      <p key={b.id}>
                        #{b.id}{" "}
                        {b.active
                          ? `v ${speed(b).toFixed(2)} m/s · ω ${angularSpeed(b).toFixed(1)} rad/s · (${b.x.toFixed(2)},${b.y.toFixed(2)},${b.z.toFixed(2)}) m`
                          : "pocket"}
                      </p>
                    ))}
                  </div>
                </>
              )}
              <details open={!simulation}>
                <summary>Aturan 8-ball</summary>
                <p>
                  Break dari belakang Head String. Masukkan bola atau kirim
                  empat bola objek berbeda ke bantalan. Pemain yang berhak
                  memilih tindakan setelah break ilegal atau bola 8 masuk.
                </p>
                <p>
                  Sesudah break, panggil bola dan pocket bertanda A–F, atau
                  pilih Safety. Call yang berhasil pada meja terbuka menentukan
                  kelompok. Sentuh kelompok sendiri dahulu, lalu masukkan bola
                  atau sentuh bantalan. Foul memberi lawan ball-in-hand. Setelah
                  kelompok habis, masukkan bola 8 ke pocket yang dipanggil untuk
                  menang.
                </p>
              </details>
              <details>
                <summary>Model & satuan</summary>
                <p>
                  Fixed 1/120 s, empat substep kontak. J=m·8P/100 N·s, bukan
                  gaya Newton. I=⅖mr². Sliding menggunakan slip v + ω×r, rolling
                  resistance μmg; sidespin berpindah pada bantalan. Jump memakai
                  pantulan meja 0.35 setelah impuls vertikal menurun melampaui
                  0.35 m/s. Tinggi prediksi vy²/2g adalah lintasan bebas sebelum
                  benturan.
                </p>
                <p>
                  Model edukatif: belum memodelkan deformasi, masse/swerve,
                  throw antarbola, atau geometri jatuh pocket. Kontak simultan
                  diselesaikan berurutan. Tidak mewakili kalibrasi meja
                  turnamen.
                </p>
              </details>
            </aside>
          )}
          {(session.paused || confirm) && !failed && (
            <Menu>
              <span className="pool-eyebrow">BILLIARD CLUB</span>
              <h2>{confirm ? "Reset progres sesi?" : "Permainan dijeda"}</h2>
              {confirm ? (
                <>
                  <p>Posisi bola dan progres permainan saat ini akan hilang.</p>
                  <button className="billiard-shoot" onClick={proceed}>
                    Ya, lanjutkan
                  </button>
                  <button onClick={() => setConfirm(null)}>Batal</button>
                </>
              ) : (
                <>
                  <button
                    className="billiard-shoot"
                    onClick={() => {
                      session.setPaused(false);
                      update();
                    }}
                  >
                    Resume
                  </button>
                  <details>
                    <summary>Settings</summary>
                    <Range
                      label="Volume musik"
                      min={0}
                      max={1}
                      step={0.05}
                      value={prefs.music}
                      onChange={(music) => setPrefs({ ...prefs, music })}
                    />
                    <Range
                      label="Volume efek"
                      min={0}
                      max={1}
                      step={0.05}
                      value={prefs.volume}
                      onChange={(volume) => setPrefs({ ...prefs, volume })}
                    />
                    <Range
                      label="Zoom Aim Camera"
                      min={0.7}
                      max={1.6}
                      step={0.05}
                      value={zoom}
                      onChange={setZoom}
                    />
                    <Range
                      label="Tinggi kamera"
                      min={0.65}
                      max={1.5}
                      step={0.05}
                      value={pitch}
                      onChange={setPitch}
                    />
                    <button
                      aria-pressed={assist}
                      onClick={() => setAssist(!assist)}
                    >
                      Bantuan bidik · {assist ? "On" : "Off"}
                    </button>
                    <button aria-pressed={low} onClick={() => setLow(!low)}>
                      Grafis · {low ? "Ringan" : "Detail"}
                    </button>
                  </details>
                  <button onClick={() => request("restart")}>Restart</button>
                  <button onClick={() => request("choose")}>Choose Mode</button>
                  <button onClick={() => request("close")}>Close Game</button>
                  {simulation && (
                    <button
                      disabled={session.status !== "moving"}
                      onClick={() => {
                        session.singleStep();
                        update();
                      }}
                    >
                      Single step (1/120 s)
                    </button>
                  )}
                </>
              )}
            </Menu>
          )}
          {session.status === "won" && !session.paused && (
            <Menu>
              <span className="pool-eyebrow">MATCH COMPLETE</span>
              <h2>Pemain {(session.winner ?? 0) + 1} menang</h2>
              <p>{session.notice}</p>
              <button className="billiard-shoot" onClick={() => reset()}>
                Main lagi
              </button>
              <button
                onClick={() => {
                  reset();
                  setSelected(false);
                }}
              >
                Choose Mode
              </button>
              <Link href="/games">Kembali ke katalog</Link>
            </Menu>
          )}
        </>
      )}
    </section>
  );
}

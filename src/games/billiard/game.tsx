"use client";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import BilliardScene from "./scene";
import { BilliardSession, type Mode } from "./session";
import {
  DEFAULT_CONFIG,
  DT,
  shotMetrics,
  speed,
  totals,
  type Config,
} from "./physics";
import { LEVELS } from "./levels";
import { EXPERIMENTS, type Experiment } from "./experiments";
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
export default function BilliardGame() {
  const [session, setSession] = useState(() => new BilliardSession());
  const [, setRevision] = useState(0);
  const [top, setTop] = useState(false),
    [cameraControl, setCameraControl] = useState(false),
    [zoom, setZoom] = useState(1);
  const [draft, setDraft] = useState<Config>({ ...DEFAULT_CONFIG });
  const [experiment, setExperiment] = useState<Experiment>("Momentum");
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => {
    session.setPaused(true);
    setFailed(true);
  }, [session]);
  const [supported] = useState(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    const available = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return available;
  });
  const update = () => setRevision((n) => n + 1);

  useEffect(() => {
    const timer = window.setInterval(() => setRevision((n) => n + 1), 100);
    const pause = () => {
      session.setPaused(true);
      setRevision((n) => n + 1);
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
      session.setPaused(true);
    };
  }, [session]);
  function reset(
    mode: Mode = session.mode,
    level = session.level,
    config = session.world.config,
    exp: Experiment = session.experiment,
  ) {
    setSession(new BilliardSession(mode, level, config, exp));
  }
  function changeMode(mode: Mode) {
    if (mode !== session.mode) {
      setDraft({ ...DEFAULT_CONFIG });
      setExperiment("Momentum");
      reset(mode, 0, DEFAULT_CONFIG, "Momentum");
    }
  }
  const level = LEVELS[session.level],
    simulation = session.mode === "simulation";
  const power = simulation ? session.initialSpeed / 0.05 : session.power;
  const predicted = shotMetrics(power, session.world.config.mass),
    actual = session.lastShot;
  const stats = totals(session.world),
    remaining = session.world.balls.filter((b) => b.id > 0 && b.active).length;
  const status = session.paused
    ? "Dijeda"
    : {
        ready: "Siap membidik",
        moving: "Bola bergerak",
        won: "Level selesai",
        lost: "Coba lagi",
      }[session.status];
  return (
    <section className="billiard-app" aria-label="Billiard playable MVP">
      <div className="billiard-topline">
        <div className="billiard-modes" role="group" aria-label="Pilih mode">
          <button aria-pressed={!simulation} onClick={() => changeMode("game")}>
            Game Mode
          </button>
          <button
            aria-pressed={simulation}
            onClick={() => changeMode("simulation")}
          >
            Simulation Mode
          </button>
        </div>
        <span className="billiard-live">● {status}</span>
      </div>
      <div className="billiard-objective">
        <div>
          <span className="small-label">
            {simulation
              ? "PHYSICS SANDBOX"
              : `POCKET CHALLENGE · ${session.level + 1} / 5`}
          </span>
          <h2>{simulation ? session.experiment : level.name}</h2>
        </div>
        <div className="billiard-score">
          {simulation ? (
            <>
              <strong>{(session.world.tick * DT).toFixed(2)} s</strong>
              <span>Waktu simulasi</span>
            </>
          ) : (
            <>
              <strong data-testid="shot-count">
                {session.strokes} + {session.penalties} / {level.limit}
              </strong>
              <span>Pukulan + penalti · {remaining} target tersisa</span>
            </>
          )}
        </div>
      </div>
      <div className="billiard-layout">
        <div className="billiard-main">
          <div
            className="billiard-viewport"
            data-tick={session.world.tick}
            data-state={session.status}
            data-cue-x={session.world.balls[0].x.toFixed(6)}
            data-cue-z={session.world.balls[0].z.toFixed(6)}
            data-targets={remaining}
            data-dropped-frames={session.droppedFrames}
            data-event-limit-hits={session.world.eventLimitHits}
            tabIndex={0}
            role="region"
            aria-label="Area permainan. Panah kiri kanan untuk bidikan, Spasi untuk Shoot, P untuk jeda."
            onKeyDown={(e) => {
              keyboardInput(session, e);
              update();
            }}
          >
            {supported === null ? (
              <div className="game-loading" role="status">
                Memeriksa WebGL…
              </div>
            ) : failed || !supported ? (
              <div className="billiard-fallback" role="alert">
                <h3>Meja 3D belum dapat ditampilkan</h3>
                <p>
                  WebGL 2 tidak tersedia atau konteks grafis terputus. Aktifkan
                  akselerasi grafis atau gunakan browser yang mendukung WebGL.
                </p>
                <button onClick={() => window.location.reload()}>
                  Muat ulang game
                </button>
              </div>
            ) : (
              <SceneBoundary onError={fail}>
                <BilliardScene
                  session={session}
                  top={top}
                  cameraControl={cameraControl}
                  zoom={zoom}
                  onFailure={fail}
                />
              </SceneBoundary>
            )}
            {session.paused && !failed && supported && (
              <div className="billiard-pause">
                <strong>Permainan dijeda</strong>
                <button
                  onClick={() => {
                    session.setPaused(false);
                    update();
                  }}
                >
                  Lanjutkan
                </button>
              </div>
            )}
            <div className="billiard-camera">
              <button onClick={() => setTop(!top)} aria-pressed={top}>
                {top ? "Perspektif" : "Top-down"}
              </button>
              <button
                onClick={() => setCameraControl(!cameraControl)}
                aria-pressed={cameraControl}
              >
                {cameraControl ? "Kamera aktif" : "Bidikan aktif"}
              </button>
            </div>
            <span className="billiard-table-label">
              2.54 × 1.27 m ·{" "}
              {cameraControl
                ? "Drag untuk kamera · pinch / scroll untuk zoom"
                : "Drag meja untuk membidik"}
            </span>
          </div>
          <div
            className="billiard-notice"
            role="status"
            data-testid="game-notice"
          >
            {session.notice}
          </div>
          <div className="billiard-physics" aria-label="Physics HUD">
            <div>
              <span>Shot Power</span>
              <strong data-testid="power">{power.toFixed(0)}%</strong>
            </div>
            <div>
              <span>Predicted Initial Velocity</span>
              <strong data-testid="predicted-velocity">
                {predicted.velocity.toFixed(2)} <small>m/s</small>
              </strong>
            </div>
            <div>
              <span>Estimated Impulse</span>
              <strong data-testid="predicted-impulse">
                {predicted.impulse.toFixed(3)} <small>N·s</small>
              </strong>
            </div>
            <div>
              <span>Predicted Kinetic Energy</span>
              <strong data-testid="predicted-energy">
                {predicted.energy.toFixed(3)} <small>J</small>
              </strong>
            </div>
          </div>
          {actual && (
            <p className="billiard-actual" data-testid="actual-shot">
              Pukulan aktual: v₀ {actual.velocity.toFixed(2)} m/s · J{" "}
              {actual.impulse.toFixed(3)} N·s · E₀ {actual.energy.toFixed(3)} J
            </p>
          )}
        </div>
        <aside className="billiard-controls" aria-label="Kontrol permainan">
          {simulation ? (
            <>
              <label className="billiard-select">
                Eksperimen
                <select
                  aria-label="Eksperimen"
                  value={experiment}
                  onChange={(e) => {
                    const exp = e.target.value as Experiment;
                    setExperiment(exp);
                    reset("simulation", 0, draft, exp);
                  }}
                >
                  {EXPERIMENTS.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <p className="billiard-help">
                Pergantian eksperimen mereset sesi. Ubah parameter lalu terapkan
                untuk world baru.
              </p>
            </>
          ) : (
            <>
              <label className="billiard-select">
                Level
                <select
                  aria-label="Level"
                  value={session.level}
                  onChange={(e) =>
                    reset("game", Number(e.target.value), DEFAULT_CONFIG)
                  }
                >
                  {LEVELS.map((l, i) => (
                    <option key={l.name} value={i}>
                      {i + 1}. {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="billiard-help">{level.hint}</p>
            </>
          )}
          <Range
            label="Sudut bidikan"
            value={Math.round((session.angle * 1800) / Math.PI) / 10}
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
          {simulation ? (
            <Range
              label="Kecepatan awal"
              value={session.initialSpeed}
              min={0}
              max={5}
              step={0.05}
              unit=" m/s"
              disabled={!session.canShoot}
              onChange={(v) => {
                session.setInitialSpeed(v);
                update();
              }}
            />
          ) : (
            <Range
              label="Power"
              value={session.power}
              min={0}
              max={100}
              unit="%"
              disabled={!session.canShoot}
              onChange={(v) => {
                session.setPower(v);
                update();
              }}
            />
          )}
          <button
            className="billiard-shoot"
            disabled={!session.canShoot || power <= 0 || !supported || failed}
            onClick={() => {
              session.queueShot();
              update();
            }}
          >
            Shoot <span>↗</span>
          </button>
          <div className="billiard-actions">
            <button
              disabled={failed || !supported}
              onClick={() => {
                session.setPaused(!session.paused);
                update();
              }}
            >
              {session.paused ? "Lanjutkan" : "Pause"}
            </button>
            <button onClick={() => reset()}>
              {simulation ? "Reset experiment" : "Restart"}
            </button>
          </div>
          {session.status === "won" && !simulation && session.level < 4 && (
            <button
              className="billiard-next"
              onClick={() => reset("game", session.level + 1, DEFAULT_CONFIG)}
            >
              Next level →
            </button>
          )}
          {session.status === "won" && session.level === 4 && (
            <p role="status">
              Seluruh tantangan selesai. Selamat bereksperimen!
            </p>
          )}
          <details className="billiard-details">
            <summary>Kamera & panduan kontrol</summary>
            <Range
              label="Zoom kamera"
              value={zoom}
              min={0.8}
              max={1.5}
              step={0.05}
              onChange={setZoom}
            />
            <p>
              Mode Bidikan: drag meja atau gunakan slider sudut. Mode Kamera:
              drag memutar perspektif. Scroll / pinch dua jari untuk zoom. Fokus
              meja: ← → membidik, Spasi menembak, P menjeda.
            </p>
          </details>
          {simulation && (
            <details className="billiard-details" open>
              <summary>Parameter eksperimen</summary>
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
              <button onClick={() => reset("simulation", 0, draft, experiment)}>
                Terapkan & reset
              </button>
              <p>
                Nilai aktif: m {session.world.config.mass} kg · μ{" "}
                {session.world.config.friction} · e{" "}
                {session.world.config.restitution} · e bantalan{" "}
                {session.world.config.cushion}. Bantalan dibatasi ≤ restitusi
                bola.
              </p>
            </details>
          )}
        </aside>
      </div>
      {simulation && (
        <section className="billiard-results">
          <h3>Data simulasi</h3>
          <div className="billiard-physics">
            <div>
              <span>Kecepatan bola putih</span>
              <strong>{speed(session.world.balls[0]).toFixed(3)} m/s</strong>
            </div>
            <div>
              <span>Momentum total (X, Z)</span>
              <strong>
                ({stats.px.toFixed(3)}, {stats.pz.toFixed(3)}) kg·m/s
              </strong>
            </div>
            <div>
              <span>Energi translasi total</span>
              <strong>{stats.energy.toFixed(4)} J</strong>
            </div>
            <div>
              <span>Energi awal pukulan</span>
              <strong>{actual?.energy.toFixed(4) ?? "—"} J</strong>
            </div>
          </div>
          <svg
            className="billiard-chart"
            viewBox="0 0 600 90"
            role="img"
            aria-label="Grafik energi total terhadap waktu simulasi, hingga 12 detik terakhir"
          >
            <path d="M0 5V80H600" fill="none" stroke="#64748b" />
            <polyline
              points={session.samples
                .map(
                  (s, i) =>
                    `${(i * 600) / 119},${80 - (s.energy / Math.max(actual?.energy ?? 1, 0.001)) * 70}`,
                )
                .join(" ")}
              fill="none"
              stroke="#6ce4bf"
              strokeWidth="2"
            />
            <text x="10" y="16" fill="#b8c4d9" fontSize="10">
              E (J) · 0 – {actual?.energy.toFixed(3) ?? "0"}
            </text>
            <text x="460" y="76" fill="#b8c4d9" fontSize="10">
              waktu (0.1 s / sampel)
            </text>
          </svg>
          <div className="billiard-ball-data">
            {session.world.balls.map((b) => (
              <span key={b.id}>
                Bola {b.id}:{" "}
                {b.active
                  ? `${speed(b).toFixed(3)} m/s · p ${(b.mass * speed(b)).toFixed(3)} kg·m/s · E ${(0.5 * b.mass * speed(b) ** 2).toFixed(4)} J`
                  : "masuk pocket"}
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              if (session.paused) {
                session.singleStep();
                update();
              }
            }}
            disabled={!session.paused || session.status !== "moving"}
          >
            Single step (1/120 s)
          </button>
        </section>
      )}
      <details className="billiard-model">
        <summary>Model fisika & satuan SI</summary>
        <p>
          Model edukatif 2.5D: bola bergerak di bidang XZ; Y tetap pada radius
          0.028575 m. Massa default 0.17 kg, fixed tick 1/120 s. Power adalah
          input kecepatan: v₀ = 5 × Power / 100 m/s; bukan gaya Newton. J = Δp =
          m v₀ (N·s), p = m v (kg·m/s), E = ½mv² (J). Tidak menampilkan gaya
          rata-rata tanpa durasi kontak.
        </p>
        <p>
          Hambatan efektif a = μ × 9.81 m/s²; tanpa spin, jump, throw, atau
          energi rotasi. Tumbukan impuls normal, restitusi 0–1; momentum total
          berubah akibat bantalan, pocket dan gesekan. Capture pocket saat pusat
          bola masuk radius 0.065 m. Scratch menambah satu penalti dan bola
          putih kembali ke tempat aman setelah meja diam. Batas level menghitung
          pukulan + penalti; target terakhir menyelesaikan level setelah meja
          diam. Tab tersembunyi otomatis menjeda; resume melalui tombol.
        </p>
      </details>
    </section>
  );
}

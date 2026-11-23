"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { GameRuntime } from "@/games/runtime";
import { frameSandbox, runtimeSource } from "@/games/runtime";

export function EmbeddedGame({
  runtime,
  title,
}: {
  runtime: Exclude<GameRuntime, { kind: "native" }>;
  title: string;
}) {
  const src = runtimeSource(runtime);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const canEmbed = runtime.kind === "html5" || runtime.embed;
  useEffect(() => {
    if (!canEmbed || loaded) return;
    const timer = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(timer);
  }, [attempt, canEmbed, loaded]);

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.current?.requestFullscreen)
        await frame.current.requestFullscreen();
      else
        setMessage(
          "Fullscreen tidak tersedia di browser ini. Gunakan tampilan layar penuh halaman ini.",
        );
    } catch {
      setMessage(
        "Browser menolak fullscreen. Permainan tetap dapat digunakan di halaman ini.",
      );
    }
  }
  function retry() {
    setLoaded(false);
    setSlow(false);
    setAttempt((value) => value + 1);
  }
  return (
    <section className="embedded-game" aria-label={`Player ${title}`}>
      <div className="embed-actions">
        {canEmbed && (
          <button className="button secondary" onClick={fullscreen}>
            Fullscreen
          </button>
        )}
        {runtime.kind === "external" && (
          <a
            className="button secondary"
            href={src}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka di situs game ↗
          </a>
        )}
      </div>
      {message && <p role="status">{message}</p>}
      {canEmbed ? (
        <>
          <div
            ref={frame}
            className={`embed-frame ${runtime.kind === "html5" && runtime.layout === "immersive" ? "embed-immersive" : ""}`}
            style={
              {
                aspectRatio: runtime.aspectRatio ?? "16/9",
                "--frame-ratio":
                  runtime.aspectRatio === "9/16"
                    ? 9 / 16
                    : runtime.aspectRatio === "4/3"
                      ? 4 / 3
                      : 16 / 9,
              } as CSSProperties
            }
          >
            {!loaded && (
              <div className="embed-loading" role="status">
                {slow
                  ? "Game membutuhkan waktu lebih lama untuk dimuat."
                  : "Memuat permainan…"}
              </div>
            )}
            <iframe
              key={attempt}
              src={src}
              title={title}
              sandbox={frameSandbox(runtime)}
              allow="fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
            />
          </div>
          <div className="embed-help">
            <p>
              Game tidak tampil? Hosting mungkin membatasi embed. Coba muat
              ulang
              {runtime.kind === "external"
                ? " atau buka di situs game"
                : " dan periksa build game"}
              .
            </p>
            <button className="button secondary" onClick={retry}>
              Muat ulang game
            </button>
          </div>
        </>
      ) : (
        <div className="runtime-loading">
          <h2>Mainkan di situs game</h2>
          <p>
            Game ini tersedia melalui tautan eksternal. Gunakan tombol di atas
            untuk mulai bermain.
          </p>
        </div>
      )}
    </section>
  );
}

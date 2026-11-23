"use client";

import Link from "next/link";
import { Component, type ReactNode } from "react";
import type { Game } from "@/data/games";
import { nativeGames } from "./native-games";
import { EmbeddedGame } from "./embedded-game";

class RuntimeBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="runtime-loading" role="alert">
          <h1>Game belum berhasil dimuat.</h1>
          <p>Coba muat ulang untuk memulai sesi baru.</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Coba lagi
          </button>
          <Link className="back-link" href="/games">
            Kembali ke katalog
          </Link>
        </div>
      );
    return this.props.children;
  }
}

export function GamePlayer({
  game,
}: {
  game: Extract<Game, { status: "Playable" }>;
}) {
  const runtime = game.runtime;
  const native = runtime.kind === "native" ? nativeGames[runtime.id] : null;
  const NativeGame = native?.component;
  return (
    <div className="game-player">
      <RuntimeBoundary key={game.slug}>
        {NativeGame && native?.ownsShell ? (
          <NativeGame />
        ) : (
          <div className="player-shell">
            <header className="player-toolbar">
              <Link className="back-link" href="/games">
                ← Kembali ke katalog
              </Link>
              <h1>{game.title}</h1>
            </header>
            {NativeGame ? (
              <div className="native-frame">
                <NativeGame />
              </div>
            ) : runtime.kind !== "native" ? (
              <EmbeddedGame
                key={game.slug}
                runtime={runtime}
                title={game.title}
              />
            ) : (
              <p role="alert">Runtime belum terdaftar.</p>
            )}
          </div>
        )}
      </RuntimeBoundary>
    </div>
  );
}

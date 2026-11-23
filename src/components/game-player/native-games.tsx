"use client";

import dynamic from "next/dynamic";
import type { GameRuntime } from "@/games/runtime";

export function RuntimeLoading() {
  return (
    <div className="runtime-loading" role="status">
      <div className="skeleton" />
      Memuat permainan…
    </div>
  );
}

// Literal import paths keep each engine in its own lazy chunk. Never import this from the catalog.
export const nativeGames: Record<
  Extract<GameRuntime, { kind: "native" }>["id"],
  { component: React.ComponentType; ownsShell?: boolean }
> = {
  billiard: {
    ownsShell: true,
    component: dynamic(
      () =>
        import("@/games/billiard/game-loader").then(
          (module) => module.GameLoader,
        ),
      {
        ssr: false,
        loading: RuntimeLoading,
      },
    ),
  },
};

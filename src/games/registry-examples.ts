import type { GameRuntime } from "./runtime";

// Examples only: not imported by the public catalog and not advertised as playable.
export const runtimeExamples = {
  native: { kind: "native", id: "billiard" },
  html5: {
    kind: "html5",
    src: "/games-html/my-game/index.html",
    aspectRatio: "16/9",
  },
  external: {
    kind: "external",
    src: "https://games.example.com/my-game/",
    embed: false,
    aspectRatio: "16/9",
  },
} satisfies Record<string, GameRuntime>;

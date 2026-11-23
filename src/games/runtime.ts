export type GameRuntime =
  | { kind: "native"; id: "billiard" }
  | {
      kind: "html5";
      src: string;
      layout?: "immersive";
      aspectRatio?: "16/9" | "4/3" | "9/16";
      pointerLock?: boolean;
    }
  | {
      kind: "external";
      src: string;
      embed: boolean;
      aspectRatio?: "16/9" | "4/3" | "9/16";
      pointerLock?: boolean;
    };

// Registry entries are reviewed source code; validate URL boundaries before rendering.
export function runtimeSource(
  runtime: Exclude<GameRuntime, { kind: "native" }>,
) {
  if (runtime.kind === "html5") {
    if (
      !/^\/(?:games-html|embedded-games)\/(?:[a-zA-Z0-9_-]+\/)+index\.html$/.test(
        runtime.src,
      )
    )
      throw new Error(
        "Build HTML5 harus berada di /games-html/<slug>/index.html atau /embedded-games/<slug>/index.html.",
      );
    return runtime.src;
  }
  const url = new URL(runtime.src);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Game eksternal harus memakai URL HTTPS tanpa kredensial.");
  return url.href;
}

export function frameSandbox(
  runtime: Exclude<GameRuntime, { kind: "native" }>,
) {
  // Opaque origin: never combine scripts and same-origin on locally hosted games.
  return runtime.pointerLock
    ? "allow-scripts allow-pointer-lock"
    : "allow-scripts";
}

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { games } from "../../src/data/games";
import { frameSandbox, runtimeSource } from "../../src/games/runtime";
import { runtimeExamples } from "../../src/games/registry-examples";
import { EmbeddedGame } from "../../src/components/game-player/embedded-game";
import config from "../../next.config";

describe("game registry and runtime trust boundaries", () => {
  it("keeps the five real entries and requires a runtime only for playable games", () => {
    expect(new Set(games.map((game) => game.slug)).size).toBe(5);
    expect(
      games
        .filter((game) => game.status === "Playable")
        .map((game) => game.slug),
    ).toEqual(["billiard"]);
    expect(
      games
        .filter((game) => game.status !== "Playable")
        .every((game) => !game.runtime),
    ).toBe(true);
    expect(runtimeExamples.native).toEqual({ kind: "native", id: "billiard" });
  });
  it("accepts nested local builds and rejects traversal and foreign origins", () => {
    expect(
      runtimeSource({
        kind: "html5",
        src: "/games-html/pendulum/v1/index.html",
      }),
    ).toBe("/games-html/pendulum/v1/index.html");
    for (const src of [
      "//evil.example/index.html",
      "/games-html/../index.html",
      "/games-html/%2e%2e/index.html",
      "/games-html/a\\b/index.html",
      "https://evil.example/index.html",
      "/games-html/a/index.html?redirect=1",
    ])
      expect(() => runtimeSource({ kind: "html5", src })).toThrow();
  });
  it("allows external HTTPS but rejects credentials and executable schemes", () => {
    expect(runtimeSource(runtimeExamples.external)).toBe(
      "https://games.example.com/my-game/",
    );
    for (const src of [
      "javascript:alert(1)",
      "data:text/html,test",
      "http://example.com",
      "https://user:password@example.com",
      "//example.com",
    ])
      expect(() =>
        runtimeSource({ kind: "external", src, embed: true }),
      ).toThrow();
  });
  it("never grants same-origin, popup, or top-navigation capability", () => {
    expect(frameSandbox(runtimeExamples.html5)).toBe("allow-scripts");
    expect(frameSandbox({ ...runtimeExamples.html5, pointerLock: true })).toBe(
      "allow-scripts allow-pointer-lock",
    );
  });
  it("isolates standalone documents even outside the player", async () => {
    const headers = await config.headers!();
    expect(headers[0].source).toBe("/games-html/:path*");
    expect(headers[0].headers).toContainEqual({
      key: "Content-Security-Policy",
      value: "sandbox allow-scripts allow-pointer-lock; frame-ancestors 'self'",
    });
  });
  it("renders HTML5 with an accessible sandboxed frame and recovery controls", () => {
    const html = renderToStaticMarkup(
      createElement(EmbeddedGame, {
        runtime: runtimeExamples.html5,
        title: "Pendulum",
      }),
    );
    expect(html).toContain('title="Pendulum"');
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).toContain('allow="fullscreen"');
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toContain("Muat ulang game");
    expect(html).not.toContain('target="_blank"');
  });
  it("only embeds external games when explicitly enabled and always offers an external link", () => {
    const render = (embed: boolean) =>
      renderToStaticMarkup(
        createElement(EmbeddedGame, {
          runtime: { ...runtimeExamples.external, embed },
          title: "External",
        }),
      );
    expect(render(false)).not.toContain("<iframe");
    expect(render(true)).toContain("<iframe");
    expect(render(false)).toContain('rel="noopener noreferrer"');
    expect(render(true)).toContain('sandbox="allow-scripts"');
  });
});

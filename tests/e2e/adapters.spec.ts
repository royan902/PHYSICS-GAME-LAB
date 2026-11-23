import { test, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmbeddedGame } from "../../src/components/game-player/embedded-game";

test("standalone adapter executes game scripts but isolates parent and storage", async ({
  page,
  request,
}) => {
  // Test-only network fixtures: no demo games or harness routes enter the shipped catalog.
  const headers = (
    await request.get("/games-html/fixture/index.html")
  ).headers();
  expect(headers["content-security-policy"]).toContain("sandbox allow-scripts");
  expect(headers["content-security-policy"]).not.toContain("allow-same-origin");
  expect(headers["access-control-allow-origin"]).toBe("*");
  await page.route("**/games-html/fixture/index.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: {
        "Content-Security-Policy": headers["content-security-policy"],
      },
      body: '<!doctype html><html><body><button id="start">Start fixture</button><output id="result"></output><script>document.querySelector("#start").onclick=()=>{let isolated=false;try{parent.document.body}catch{isolated=true}document.querySelector("#result").textContent=isolated?"Running safely":"Parent exposed"}</script></body></html>',
    }),
  );
  const markup = renderToStaticMarkup(
    createElement(EmbeddedGame, {
      title: "Adapter fixture",
      runtime: { kind: "html5", src: "/games-html/fixture/index.html" },
    }),
  );
  await page.route("**/adapter-harness", (route) =>
    route.fulfill({ contentType: "text/html", body: markup }),
  );
  await page.goto("/adapter-harness");
  const frame = page.frameLocator('iframe[title="Adapter fixture"]');
  await frame.getByRole("button", { name: "Start fixture" }).click();
  await expect(frame.locator("output")).toHaveText("Running safely");
  const child = page
    .frames()
    .find((item) => item.url().includes("fixture/index.html"))!;
  expect(
    await child.evaluate(() => {
      try {
        localStorage.setItem("escape", "1");
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Fullscreen", exact: true }),
  ).toBeVisible();
});

test("external adapter keeps an escape link when a host refuses embedding", async ({
  page,
}) => {
  await page.route("https://games.example.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: { "X-Frame-Options": "DENY" },
      body: "Embed forbidden",
    }),
  );
  const markup = renderToStaticMarkup(
    createElement(EmbeddedGame, {
      title: "External fixture",
      runtime: {
        kind: "external",
        src: "https://games.example.com/demo/",
        embed: true,
      },
    }),
  );
  await page.route("**/adapter-harness", (route) =>
    route.fulfill({ contentType: "text/html", body: markup }),
  );
  await page.goto("/adapter-harness");
  await expect(
    page.getByRole("link", { name: /Buka di situs game/ }),
  ).toHaveAttribute("href", "https://games.example.com/demo/");
  await expect(
    page.getByRole("link", { name: /Buka di situs game/ }),
  ).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByText(/Hosting mungkin membatasi embed/)).toBeVisible();
});

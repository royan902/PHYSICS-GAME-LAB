// Run against npm run start -- --port 3103. No browser security overrides.
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
const baseURL = "http://127.0.0.1:3103";
const browser = await chromium.launch({
  channel: "msedge",
  chromiumSandbox: true,
});
const lifecycleOnly = process.argv.includes("--lifecycle-only");
const report = lifecycleOnly
  ? JSON.parse(await readFile("docs/previews/phase-3-performance.json", "utf8"))
  : {
      date: new Date().toISOString(),
      os: os.release(),
      cpu: os.cpus()[0].model,
      browser: browser.version(),
      samples: [],
      lifecycle: [],
    };
report.lifecycle = [];
for (const mobile of lifecycleOnly ? [] : [false, true]) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 375, height: 812 }
      : { width: 1440, height: 1000 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: 10_000_000 / 8,
    uploadThroughput: 10_000_000 / 8,
    latency: 100,
  });
  const start = performance.now();
  await page.goto(`${baseURL}/games/billiard`);
  await page.getByRole("button", { name: /^Shoot/ }).waitFor();
  await page.waitForFunction(() => {
    const c = document.querySelector("canvas");
    return c && c.dataset.geometries;
  });
  const readyMs = performance.now() - start;
  const transfer = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("/_next/"))
      .reduce((s, r) => s + r.transferSize, 0),
  );
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
  await page.getByLabel("Level", { exact: true }).selectOption("4");
  await page.getByRole("slider", { name: "Power", exact: true }).focus();
  await page.keyboard.press("End");
  await page.locator("canvas").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.geometries,
  );
  const result = await page.evaluate(async () => {
    const canvas = document.querySelector("canvas"),
      gl = canvas.getContext("webgl2"),
      debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    const longTasks = [];
    const observer = new PerformanceObserver((list) =>
      longTasks.push(...list.getEntries().map((e) => e.duration)),
    );
    observer.observe({ type: "longtask", buffered: false });
    const durations = [];
    let previous = performance.now();
    const begin = previous;
    let shots = 0;
    const actions = setInterval(() => {
      const shoot = document.querySelector(".billiard-shoot");
      if (shoot && !shoot.disabled) {
        shoot.click();
        shots++;
      }
      const state = document.querySelector(".billiard-viewport")?.dataset.state;
      if (state === "lost" || state === "won")
        Array.from(document.querySelectorAll("button"))
          .find((b) => b.textContent === "Restart")
          ?.click();
    }, 500);
    await new Promise((resolve) => {
      function frame(now) {
        durations.push(now - previous);
        previous = now;
        if (now - begin >= 60000) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    clearInterval(actions);
    observer.disconnect();
    durations.shift();
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)],
      p95 = durations[Math.floor(durations.length * 0.95)];
    return {
      renderer,
      durationSeconds: (performance.now() - begin) / 1000,
      frames: durations.length,
      medianFrameMs: median,
      p95FrameMs: p95,
      medianFPS: 1000 / median,
      longTasks: longTasks.length,
      maxLongTaskMs: Math.max(0, ...longTasks),
      shots,
      resources: { ...canvas.dataset },
      diagnostics: { ...document.querySelector(".billiard-viewport").dataset },
      dpr: devicePixelRatio,
      canvasPixels: [canvas.width, canvas.height],
    };
  });
  const entry = {
    profile: mobile ? "mobile-emulated" : "desktop",
    readyMs,
    coldNextTransferBytes: transfer,
    errors,
    ...result,
  };
  report.samples.push(entry);
  console.log(JSON.stringify(entry));
  await writeFile(
    "docs/previews/phase-3-performance.json",
    JSON.stringify(report, null, 2),
  );
  await context.close();
}
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
for (let i = 0; i < 10; i++) {
  if (i === 0) await page.goto(`${baseURL}/games/billiard`);
  else
    await page
      .getByRole("link", { name: "Lihat detail Billiard Physics" })
      .click();
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.geometries,
  );
  const resources = await page
    .locator("canvas")
    .evaluate((c) => ({ ...c.dataset }));
  await page.getByRole("link", { name: "Kembali ke katalog" }).click();
  await page.waitForURL(`${baseURL}/games`);
  await page.waitForFunction(
    () => document.querySelectorAll("canvas").length === 0,
  );
  const canvases = await page.locator("canvas").count();
  report.lifecycle.push({
    cycle: i + 1,
    resources,
    canvasesAfterLeave: canvases,
  });
}
await page.goto(baseURL);
report.homeResources = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .filter((r) => r.name.includes("/_next/"))
    .map((r) => ({ name: r.name.split("/").at(-1), bytes: r.transferSize })),
);
await context.close();
await browser.close();
await writeFile(
  "docs/previews/phase-3-performance.json",
  JSON.stringify(report, null, 2),
);
console.log("Saved docs/previews/phase-3-performance.json");

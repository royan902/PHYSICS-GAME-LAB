import { test, expect, type Page } from "@playwright/test";
async function range(page: Page, label: string, value: number) {
  await page
    .getByRole("slider", { name: label, exact: true })
    .evaluate((node, value) => {
      const input = node as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
}
test("playable Canvas, aim, HUD, pause, pocket, progression and restart", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/games");
  await page
    .getByRole("link", { name: "Lihat detail Billiard Physics" })
    .click();
  const canvas = page.locator("canvas"),
    viewport = page.locator(".billiard-viewport");
  await expect(canvas).toBeVisible();
  await expect(page.getByRole("button", { name: /^Shoot/ })).toBeEnabled();
  await page.getByRole("button", { name: "Top-down", exact: true }).click();
  await canvas.scrollIntoViewIfNeeded();
  const before = await page
    .getByRole("slider", { name: "Sudut bidikan" })
    .inputValue();
  const b = (await canvas.boundingBox())!;
  if (info.project.use.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: b.x + b.width * 0.4, y: b.y + b.height * 0.4, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: b.x + b.width * 0.7, y: b.y + b.height * 0.5, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.5, {
      steps: 6,
    });
    await page.mouse.up();
  }
  await expect
    .poll(() =>
      page.getByRole("slider", { name: "Sudut bidikan" }).inputValue(),
    )
    .not.toBe(before);
  await viewport.focus();
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await range(page, "Power", 40);
  await expect(page.getByTestId("predicted-velocity")).toHaveText("2.00 m/s");
  await expect(page.getByTestId("predicted-impulse")).toHaveText("0.340 N·s");
  await expect(page.getByTestId("predicted-energy")).toHaveText("0.340 J");
  await range(page, "Power", 25);
  await page.screenshot({
    path: `docs/previews/billiard-${info.project.name}.png`,
    fullPage: true,
  });
  const imageBefore = await canvas.screenshot();
  await page.getByRole("button", { name: /^Shoot/ }).click();
  await expect(page.getByTestId("shot-count")).toHaveText("1 + 0 / 3");
  await expect(page.getByRole("button", { name: /^Shoot/ })).toBeDisabled();
  await expect(page.getByTestId("actual-shot")).toContainText(
    "v₀ 1.25 m/s · J 0.213 N·s · E₀ 0.133 J",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const tick = await viewport.getAttribute("data-tick"),
    z = await viewport.getAttribute("data-cue-z");
  await page.waitForTimeout(250); // verifies no advancement over wall time while paused
  await expect(viewport).toHaveAttribute("data-tick", tick!);
  await expect(viewport).toHaveAttribute("data-cue-z", z!);
  await page
    .getByRole("button", { name: "Lanjutkan", exact: true })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Next level →" })).toBeVisible({
    timeout: 20000,
  });
  await expect(viewport).toHaveAttribute("data-targets", "0");
  const imageAfter = await canvas.screenshot();
  expect(imageAfter.equals(imageBefore)).toBe(false);
  await page.screenshot({
    path: `docs/previews/billiard-win-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next level →" }).click();
  await expect(
    page.getByRole("heading", { name: "Double Hit", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("shot-count")).toHaveText("0 + 0 / 6");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(page.getByTestId("shot-count")).toHaveText("0 + 0 / 6");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Kembali ke katalog" }).click();
  await page
    .getByRole("link", { name: "Lihat detail Billiard Physics" })
    .click();
  await expect(
    page.getByRole("heading", { name: "First Shot", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(canvas).toBeVisible();
  expect(errors).toEqual([]);
});
test("simulation parameters, experiments, actual HUD, single step and background pause", async ({
  page,
}, info) => {
  await page.goto("/games/billiard");
  await page
    .getByRole("button", { name: "Simulation Mode", exact: true })
    .click();
  await page
    .getByLabel("Eksperimen", { exact: true })
    .selectOption("Koefisien gesek");
  await range(page, "Massa bola", 0.3);
  await range(page, "Koefisien gesek", 0.08);
  await range(page, "Restitusi bola", 0.5);
  await page
    .getByRole("button", { name: "Terapkan & reset", exact: true })
    .click();
  await expect(page.getByText("Nilai aktif:", { exact: false })).toContainText(
    "m 0.3 kg · μ 0.08 · e 0.5",
  );
  await range(page, "Kecepatan awal", 1);
  await expect(page.getByTestId("predicted-impulse")).toHaveText("0.300 N·s");
  await expect(page.getByTestId("predicted-energy")).toHaveText("0.150 J");
  await page.getByRole("button", { name: /^Shoot/ }).click();
  await expect(page.getByTestId("actual-shot")).toContainText(
    "v₀ 1.00 m/s · J 0.300 N·s · E₀ 0.150 J",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const viewport = page.locator(".billiard-viewport");
  const tick = Number(await viewport.getAttribute("data-tick"));
  await page
    .getByRole("button", { name: "Single step (1/120 s)", exact: true })
    .click();
  await expect(viewport).toHaveAttribute("data-tick", String(tick + 1));
  await page
    .getByRole("button", { name: "Lanjutkan", exact: true })
    .first()
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(
    page.getByText("Permainan dijeda", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset experiment", exact: true })
    .click();
  await expect(viewport).toHaveAttribute("data-tick", "0");
  for (const name of [
    "Momentum",
    "Tumbukan dua bola",
    "Energi kinetik",
    "Koefisien restitusi",
  ]) {
    await page.getByLabel("Eksperimen", { exact: true }).selectOption(name);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Shoot/ })).toBeEnabled();
  }
  await page.getByRole("button", { name: /^Shoot/ }).click();
  await expect(viewport).toHaveAttribute("data-state", "moving");
  await page.screenshot({
    path: `docs/previews/billiard-simulation-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Game Mode", exact: true }).click();
  await expect(page.getByTestId("shot-count")).toHaveText("0 + 0 / 3");
});
test("WebGL unavailable shows readable fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/games/billiard");
  await expect(
    page.getByRole("heading", { name: "Meja 3D belum dapat ditampilkan" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Shoot/ })).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Kembali ke katalog" }),
  ).toBeVisible();
});
test("camera interaction stays separate from aim; wheel or pinch zoom works", async ({
  page,
}, info) => {
  await page.goto("/games/billiard");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await page
    .getByRole("button", { name: "Bidikan aktif", exact: true })
    .click();
  await canvas.scrollIntoViewIfNeeded();
  const angle = await page
    .getByRole("slider", { name: "Sudut bidikan" })
    .inputValue();
  const b = (await canvas.boundingBox())!;
  const imageBefore = await canvas.screenshot();
  if (info.project.use.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: center.x - 30, y: center.y, id: 0 },
        { x: center.x + 30, y: center.y, id: 1 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: center.x - 65, y: center.y, id: 0 },
        { x: center.x + 65, y: center.y, id: 1 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(b.x + b.width * 0.45, b.y + b.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.5, {
      steps: 5,
    });
    await page.mouse.up();
    await page.mouse.wheel(0, -150);
  }
  await expect(page.getByRole("slider", { name: "Sudut bidikan" })).toHaveValue(
    angle,
  );
  await expect
    .poll(async () => (await canvas.screenshot()).equals(imageBefore))
    .toBe(false);
  await page.getByRole("button", { name: "Kamera aktif", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("shot-count")).toHaveText("0 + 0 / 3");
});
test("WebGL context loss pauses game and provides recovery", async ({
  page,
}) => {
  await page.goto("/games/billiard");
  await expect(page.locator("canvas")).toBeVisible();
  await page.locator("canvas").evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(
    page.getByRole("heading", { name: "Meja 3D belum dapat ditampilkan" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Shoot/ })).toBeDisabled();
});

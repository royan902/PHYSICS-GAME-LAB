import { test, expect, type Page } from "@playwright/test";
async function range(page: Page, label: string, value: number) {
  const input = page.getByRole("slider", { name: label, exact: true });
  await input.focus();
  await input.evaluate((node, v) => {
    const el = node as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
async function start(page: Page, mode = "Classic Mode") {
  await page.goto("/games/billiard/play");
  await page.getByRole("button", { name: new RegExp(mode) }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-geometries",
    /[1-9]/,
  );
  await expect(page.getByRole("button", { name: "Shoot ↗" })).toBeEnabled();
}
test("Classic: fullscreen, real aim input, shot, break choice, called pocket, pause, confirmation and mode reset", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const view = page.locator(".billiard-viewport"),
    canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  expect(box.width).toBe(info.project.use.viewport!.width);
  expect(box.height).toBe(info.project.use.viewport!.height);
  expect(
    await page.getByRole("slider", { name: "Sudut bidikan" }).inputValue(),
  ).toBe("0");
  if (info.project.use.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.width * 0.45, y: box.height * 0.5, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.width * 0.55, y: box.height * 0.5, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(box.width * 0.45, box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.width * 0.55, box.height * 0.5, { steps: 6 });
    await page.mouse.up();
  }
  await expect
    .poll(() =>
      page.getByRole("slider", { name: "Sudut bidikan" }).inputValue(),
    )
    .not.toBe("0");
  await page.screenshot({
    path: `test-results/break-${info.project.name}.png`,
  });
  const powerSlider = page.getByRole("slider", { name: "Power", exact: true });
  const pb = (await powerSlider.boundingBox())!;
  if (info.project.use.hasTouch)
    await page.touchscreen.tap(pb.x + pb.width / 2, pb.y + pb.height * 0.7);
  else await page.mouse.click(pb.x + pb.width / 2, pb.y + pb.height * 0.7);
  await expect
    .poll(async () => Number(await powerSlider.inputValue()))
    .toBeLessThan(100);
  await range(page, "Sudut bidikan", 180);
  await range(page, "Power", 5);
  await page.getByRole("button", { name: "Shoot ↗" }).click();
  await expect(view).toHaveAttribute("data-shots", "1");
  await expect(page.getByRole("button", { name: "Shoot ↗" })).toBeDisabled();
  await expect(page.getByTestId("game-notice")).toContainText("Foul", {
    timeout: 10000,
  });
  await expect(view).toHaveAttribute("data-player", "2");
  await page.getByRole("button", { name: "Terima posisi" }).click();
  await page
    .getByRole("combobox", { name: "Bola", exact: true })
    .selectOption("1");
  await page
    .getByRole("combobox", { name: "Pocket", exact: true })
    .selectOption("2");
  await expect(page.getByRole("button", { name: "Shoot ↗" })).toBeEnabled();
  await page.screenshot({
    path: `test-results/classic-${info.project.name}.png`,
  });
  await page.getByRole("button", { name: "Pause / Settings" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Batal" }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(view).toHaveAttribute("data-shots", "1");
  await page.getByRole("button", { name: "Pause / Settings" }).click();
  await page.getByRole("button", { name: "Choose Mode", exact: true }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(
    page.getByRole("button", { name: /Classic Mode/ }),
  ).toBeVisible();
  await expect(canvas).toHaveCount(0);
  await page.getByRole("button", { name: /Simulation Mode/ }).click();
  await expect(view).toHaveAttribute("data-shots", "0");
  expect(errors).toEqual([]);
});
test("Simulation: real spin, elevation, jump, setup, telemetry and parameter reset", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, "Simulation Mode");
  const aim = page.getByRole("slider", { name: "Sudut bidikan" });
  await page.getByRole("button", { name: "Aim Camera" }).click();
  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(box.width * 0.45, box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.width * 0.6, box.height * 0.4, { steps: 5 });
  await page.mouse.up();
  await page.mouse.wheel(0, -120);
  await expect(aim).toHaveValue("0");
  await page.getByRole("button", { name: "Free Camera" }).click();
  const spin = page.getByRole("slider", { name: "Titik pukul" });
  const sb = (await spin.boundingBox())!;
  if (info.project.use.hasTouch)
    await page.touchscreen.tap(sb.x + sb.width * 0.65, sb.y + sb.height * 0.35);
  else await page.mouse.click(sb.x + sb.width * 0.65, sb.y + sb.height * 0.35);
  await spin.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await expect(spin).not.toHaveAttribute("aria-valuenow", "0");
  await range(page, "Elevasi", 65);
  await range(page, "Power", 40);
  // Observe before the shot so a short jump cannot finish between polling samples.
  await Promise.all([
    page.waitForFunction(
      () =>
        Number(
          document
            .querySelector(".billiard-viewport")
            ?.getAttribute("data-cue-y"),
        ) > 0.03,
    ),
    page.getByRole("button", { name: "Shoot ↗" }).click(),
  ]);
  await expect(page.getByTestId("actual-shot")).toContainText("J 0.544 N·s");
  await expect(page.getByRole("button", { name: "Shoot ↗" })).toBeEnabled({
    timeout: 20000,
  });
  await page.getByRole("button", { name: "Data & setup" }).click();
  await expect(
    page.getByText("Energi kinetik total", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Bola untuk setup" })
    .selectOption("8");
  await page.getByRole("button", { name: "Atur posisi bola" }).click();
  await page.getByRole("spinbutton", { name: "Posisi X" }).fill("-0.4");
  await page.getByRole("spinbutton", { name: "Posisi Z" }).fill("0.4");
  await page.getByRole("button", { name: "Tempatkan bola" }).click();
  await expect(page.getByTestId("game-notice")).toContainText(
    "Bola 8 ditempatkan",
  );
  await page.getByRole("button", { name: "Data & setup" }).click();
  await range(page, "Massa bola", 0.3);
  await page.getByRole("button", { name: "Terapkan & reset" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await page.getByRole("button", { name: "Data & setup" }).click();
  await expect(page.getByText(/Aktif: m 0.3 kg/)).toBeVisible();
  await page.getByRole("button", { name: "Tutup ×" }).click();
  await page.screenshot({
    path: `test-results/simulation-${info.project.name}.png`,
  });
  await page.getByRole("button", { name: "Pause / Settings" }).click();
  await page.getByText("Settings", { exact: true }).click();
  await range(page, "Volume musik", 0.35);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("pool-audio")!).music,
      ),
    )
    .toBe(0.35);
  await page.getByRole("button", { name: /Bantuan bidik/ }).click();
  await expect(
    page.getByRole("button", { name: /Bantuan bidik/ }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Close Game", exact: true }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page).toHaveURL("/games");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("WebGL unavailable preserves a readable exit and disabled shot", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/games/billiard/play");
  await page.getByRole("button", { name: /Classic Mode/ }).click();
  await expect(page.locator(".billiard-fallback")).toContainText("WebGL 2");
  await expect(page.getByRole("button", { name: "Shoot ↗" })).toBeDisabled();
});

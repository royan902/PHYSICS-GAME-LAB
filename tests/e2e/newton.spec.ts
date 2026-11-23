import { test, expect, type Page, type FrameLocator } from "@playwright/test";
const slugs = ["newton-first-law", "newton-second-law", "newton-third-law"];

async function exercise(view: Page | FrameLocator, page: Page, slug: string) {
  await expect(view.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(view.locator("#runtime-error")).toBeHidden();
  await expect(view.locator(".tabs")).toHaveCount(0);
  if (slug === "newton-first-law") {
    const gas = view.getByRole("button", { name: /Injak GAS/ });
    await gas.scrollIntoViewIfNeeded();
    const box = (await gas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect
      .poll(async () =>
        parseFloat(await view.locator("#val-stat-1").innerText()),
      )
      .toBeGreaterThan(1);
    await page.mouse.up();
    await view.getByRole("button", { name: /Sabuk Pengaman: OFF/ }).click();
    await expect(view.locator("#val-stat-4")).toContainText("TERPASANG");
    const panic = view.getByRole("button", { name: /REM MENDADAK!/ });
    await panic.scrollIntoViewIfNeeded();
    const p = (await panic.boundingBox())!;
    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
    await page.mouse.down();
    await expect
      .poll(async () =>
        parseFloat(await view.locator("#val-stat-2").innerText()),
      )
      .toBeLessThan(-13);
    await page.mouse.up();
  } else if (slug === "newton-second-law") {
    await view.getByRole("slider", { name: "Gaya Gravity Gun" }).fill("600");
    await expect(view.locator("#val-stat-2")).toHaveText("120.0 m/s²");
    await expect(view.locator("#val-stat-3")).toHaveText("24.0 m/s²");
    await expect(view.locator("#val-stat-4")).toHaveText("6.0 m/s²");
    await view.getByRole("button", { name: /Tembak Semua Beban/ }).click();
    await expect(view.locator("#ui-reaction-text")).toContainText("600 N");
    await expect
      .poll(async () =>
        (await view.locator("#badge-1").innerText()).includes("x=0.0m"),
      )
      .toBe(false);
    for (const name of [/Kayu \(5kg\)/, /Brankas \(100kg\)/]) {
      await view.getByRole("button", { name }).click();
      await expect(view.locator("#ui-reaction-text")).toContainText(
        "Ditembakkan",
      );
    }
  } else {
    await view.getByRole("button", { name: "Mega Plasma" }).click();
    await expect(view.locator("#val-stat-1")).toHaveText("+1500 N");
    await expect(view.locator("#val-stat-2")).toHaveText("-1500 N");
    await view.getByRole("button", { name: /TEMBAK MERIAM/ }).click();
    await expect(view.locator("#ui-reaction-text")).toContainText("RECOIL!");
    await view.getByRole("button", { name: /LOMPAT KARAKTER/ }).click();
    await expect
      .poll(async () =>
        parseFloat(await view.locator("#val-stat-4").innerText()),
      )
      .toBeGreaterThan(0);
    for (const name of ["Peluru Ringan", "Meriam Tank"])
      await view.getByRole("button", { name, exact: true }).click();
  }
  await view.getByRole("button", { name: /Reset Posisi/ }).click();
  if (slug === "newton-first-law")
    await expect(view.locator("#val-stat-1")).toHaveText("0.0 km/j");
  if (slug === "newton-second-law")
    await expect(view.locator("#badge-1")).toContainText("x=0.0m");
  if (slug === "newton-third-law")
    await expect(view.locator("#val-stat-4")).toHaveText("0.00 m");
}

for (const slug of slugs)
  test(`${slug}: standalone, controls, reset, catalog, sandbox, fullscreen`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    const offsite: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:"))
        offsite.push(request.url());
    });
    await page.goto(`/embedded-games/${slug}/index.html`);
    await exercise(page, page, slug);
    const before = await page.locator("canvas").screenshot();
    await page.getByRole("button", { name: "Perbesar kamera" }).click();
    await expect
      .poll(
        async () => !(await page.locator("canvas").screenshot()).equals(before),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Perkecil kamera" }).click();
    await page.goto("/games");
    await page
      .getByRole("searchbox")
      .fill(
        slug === "newton-first-law"
          ? "Bus Inertia"
          : slug === "newton-second-law"
            ? "Gravity Gun"
            : "Action",
      );
    await expect(page.locator(".game-card")).toHaveCount(1);
    await page.locator(`.game-card[href="/games/${slug}"]`).click();
    await expect(page).toHaveURL(`/games/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Newton",
    );
    await page.getByRole("link", { name: /Play Now/ }).click();
    const view = page.frameLocator("iframe");
    await expect(page.locator(".embed-loading")).toBeHidden();
    await exercise(view, page, slug);
    await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
      .toBe(true);
    await page.keyboard.press("Escape");
    await page.evaluate(async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
    });
    await page.getByRole("button", { name: "Muat ulang game" }).click();
    await expect(page.locator(".embed-loading")).toBeHidden();
    await expect(view.locator("body")).toHaveAttribute("data-ready", "true");
    await page.screenshot({
      path: `test-results/${slug}-${info.project.name}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: /Kembali ke katalog/ }).click();
    await expect(page).toHaveURL("/games");
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(offsite).toEqual([]);
  });

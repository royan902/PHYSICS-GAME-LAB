import { test, expect } from "@playwright/test";
const slugs = ["billiard", "golf", "rocket-landing", "cannon", "ramp-race"];

test("home, search, catalog filters, details, about and unavailable routes", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Physics Game Lab/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Discover Physics",
  );
  await expect(page.locator(".game-card")).toHaveCount(3);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/platform-home-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Explore Games", exact: true }).click();
  await expect(page).toHaveURL("/games");
  await expect(page.locator(".game-card")).toHaveCount(5);
  for (const [filter, count] of [
    ["2D games", 1],
    ["3D games", 4],
    ["Playable", 1],
    ["Coming Soon", 4],
    ["All games", 5],
  ] as const) {
    await page.getByRole("button", { name: filter, exact: true }).click();
    await expect(page.locator(".game-card")).toHaveCount(count);
  }
  const search = page.getByRole("searchbox", {
    name: "Cari game atau konsep fisika",
  });
  await search.fill("  MOMENTUM ");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card")).toContainText("Billiard");
  await page.getByRole("button", { name: "Coming Soon", exact: true }).click();
  await expect(page.getByText("Belum ada game yang cocok.")).toBeVisible();
  await page.getByRole("button", { name: "Reset pencarian" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".game-card")).toHaveCount(5);
  await search.fill("no-such-game");
  await expect(page.locator(".game-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset pencarian" }).click();
  await page.screenshot({
    path: `test-results/platform-library-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  for (const slug of slugs) {
    await page.locator(`.game-card[href="/games/${slug}"]`).click();
    await expect(page).toHaveURL(`/games/${slug}`);
    await expect(
      page.getByRole("heading", { name: "Tentang game" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Simulation Mode", exact: true }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    if (slug === "billiard") {
      await expect(
        page.getByRole("link", { name: /Play Now/ }),
      ).toHaveAttribute("href", "/games/billiard/play");
      await expect(
        page.getByRole("heading", { name: "Classic Mode" }),
      ).toBeVisible();
      await page.screenshot({
        path: `test-results/platform-detail-${info.project.name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    } else {
      await expect(
        page.getByText("Concept preview · Gameplay belum tersedia"),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /Play Now/ })).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const image = page.locator(".detail-preview img");
    await expect(image).toBeVisible();
    expect(
      await image.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
      ),
    ).toBe(true);
    await page.reload();
    await page.getByRole("link", { name: "Kembali ke katalog" }).click();
  }
  const menu = page.getByRole("button", { name: "Buka menu" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Rasa ingin tahu",
  );
  for (const route of [
    "/games/not-a-game",
    "/games/golf/play",
    "/games/not-a-game/play",
  ]) {
    expect((await page.goto(route))?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Halaman tidak ditemukan." }),
    ).toBeVisible();
  }
  expect(errors.filter((error) => !error.includes("404"))).toEqual([]);
});

test("keyboard, reduced motion and mobile menu", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/games");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Lewati ke konten" }),
  ).toBeFocused();
  const menu = page.getByRole("button", { name: "Buka menu" });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("navigation")).not.toBeVisible();
  }
  const filter = page.getByRole("button", { name: "2D games" });
  await filter.focus();
  await page.keyboard.press("Enter");
  await expect(filter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".game-card")).toHaveCount(1);
  expect(
    await page
      .locator(".game-card")
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page.locator(".game-card").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/games/rocket-landing");
});

test("catalog stays engine-free until Play, and immersive player returns to catalog", async ({
  page,
}) => {
  await page.goto("/games/billiard");
  await expect(page.locator(".billiard-app")).toHaveCount(0);
  const initialScripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => url.includes(".js")),
  );
  for (const url of initialScripts) {
    const source = await (await page.request.get(url)).text();
    expect(source).not.toContain("THREE.WebGLRenderer");
    expect(source).not.toContain("Meja biliar. Panah untuk bidikan");
  }
  await page.getByRole("link", { name: /Play Now/ }).click();
  await expect(page).toHaveURL("/games/billiard/play");
  await expect(
    page.getByRole("button", { name: /Classic Mode/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Simulation Mode/ }),
  ).toBeVisible();
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".site-footer")).not.toBeVisible();
  const newScripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => url.includes(".js")),
  );
  expect(
    newScripts.filter((url) => !initialScripts.includes(url)).length,
  ).toBeGreaterThan(0);
  await page
    .getByRole("region", { name: "Billiard 3D", exact: true })
    .getByRole("link", { name: "Kembali ke katalog" })
    .click();
  await expect(page).toHaveURL("/games");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".billiard-app")).toHaveCount(0);
});
